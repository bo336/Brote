'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { Pip } from '@/components/pip/Pip';
import { completeLesson, type LessonDetail, type QuizPayload, type TrueFalsePayload, type InfoPayload } from '@/lib/api/aprender';
import { invalidateScores } from '@/lib/refresh';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Plays one lesson, one card at a time (F15.17).
 *
 * Answers are checked immediately and ALWAYS explained — including when you
 * get it right, because the explanation is the actual content. A wrong answer
 * is never punished beyond the score: you still see why, and you can retake
 * the lesson (points only pay out the first time you pass, enforced server
 * side, so retaking is for learning rather than farming).
 */
export function LessonPlayer({ lesson }: { lesson: LessonDetail }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedTotal, setGradedTotal] = useState(0);
  const [finished, setFinished] = useState<{ score: number; passed: boolean; points: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const step = lesson.steps[index];
  const isLast = index >= lesson.steps.length - 1;
  const answered = picked !== null;

  function grade(isCorrect: boolean) {
    haptic(isCorrect ? 'success' : 'light');
    setGradedTotal((n) => n + 1);
    if (isCorrect) setCorrectCount((n) => n + 1);
  }

  async function next() {
    if (!isLast) {
      setIndex((i) => i + 1);
      setPicked(null);
      return;
    }
    setSaving(true);
    // Lessons with no graded questions still count as passed.
    const res = await completeLesson(lesson.id, gradedTotal === 0 ? 1 : correctCount, gradedTotal === 0 ? 1 : gradedTotal);
    setSaving(false);
    if (!res.ok) {
      toast.error('No se pudo guardar', res.error);
      return;
    }
    setFinished({ score: res.score, passed: res.passed, points: res.points_awarded });
    qc.invalidateQueries({ queryKey: ['learning-path'] });
    if (res.points_awarded > 0) invalidateScores(qc);
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <Pip size={96} mood={finished.passed ? 'celebrating' : 'neutral'} aura={finished.passed} />
        <div>
          <h1 className="font-display text-h1 font-bold">
            {finished.passed ? '¡Lección completada!' : 'Casi'}
          </h1>
          <p className="mt-1 text-body text-muted-foreground">
            {finished.passed
              ? `Respondiste bien el ${finished.score}%.`
              : `Llegaste al ${finished.score}%. Necesitás 60% para aprobarla — probá de nuevo, ya conocés las respuestas.`}
          </p>
          {finished.points > 0 && (
            <p className="mt-2 font-display text-h2 font-bold text-brote-sun">+{finished.points} pts</p>
          )}
          {finished.passed && finished.points === 0 && (
            <p className="mt-2 text-caption text-muted-foreground">
              Ya la habías aprobado, así que esta vez no suma puntos.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!finished.passed && (
            <Button
              variant="primary"
              onClick={() => {
                setFinished(null);
                setIndex(0);
                setPicked(null);
                setCorrectCount(0);
                setGradedTotal(0);
              }}
            >
              Reintentar
            </Button>
          )}
          <Button variant={finished.passed ? 'primary' : 'secondary'} onClick={() => router.push('/aprender')}>
            Volver a las lecciones
          </Button>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="space-y-4 pb-8">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-caption text-muted-foreground">
          <span>
            {index + 1} de {lesson.steps.length}
          </span>
          {gradedTotal > 0 && (
            <span className="tnum">
              {correctCount}/{gradedTotal} correctas
            </span>
          )}
        </div>
        <ProgressBar value={((index + (answered ? 1 : 0)) / lesson.steps.length) * 100} />
      </div>

      {step.kind === 'info' && <InfoCard payload={step.payload as InfoPayload} />}
      {step.kind === 'quiz' && (
        <QuizCard
          payload={step.payload as QuizPayload}
          picked={picked as number | null}
          onPick={(i, ok) => {
            setPicked(i);
            grade(ok);
          }}
        />
      )}
      {step.kind === 'truefalse' && (
        <TrueFalseCard
          payload={step.payload as TrueFalsePayload}
          picked={picked as boolean | null}
          onPick={(v, ok) => {
            setPicked(v);
            grade(ok);
          }}
        />
      )}

      <Button
        block
        variant="primary"
        size="lg"
        loading={saving}
        disabled={step.kind !== 'info' && !answered}
        onClick={next}
      >
        {isLast ? 'Terminar' : 'Seguir'} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function InfoCard({ payload }: { payload: InfoPayload }) {
  return (
    <Card className="p-5">
      <p className="text-body leading-relaxed">{payload.body}</p>
      {payload.highlight && (
        <p className="mt-3 flex items-start gap-2 rounded-card border border-primary/30 bg-primary/5 p-3 text-small font-medium">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {payload.highlight}
        </p>
      )}
    </Card>
  );
}

function QuizCard({
  payload,
  picked,
  onPick,
}: {
  payload: QuizPayload;
  picked: number | null;
  onPick: (i: number, correct: boolean) => void;
}) {
  return (
    <Card className="p-5">
      <p className="font-display text-h3 font-bold leading-snug">{payload.question}</p>
      <div className="mt-3 space-y-2">
        {payload.options.map((opt, i) => {
          const isCorrect = i === payload.correct;
          const chosen = picked === i;
          const reveal = picked !== null;
          return (
            <button
              key={i}
              disabled={reveal}
              onClick={() => onPick(i, isCorrect)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-card border p-3 text-left text-small transition-colors',
                !reveal && 'border-border bg-surface hover:border-primary/40',
                reveal && isCorrect && 'border-brote-green bg-brote-green/10',
                reveal && chosen && !isCorrect && 'border-brote-coral bg-brote-coral/10',
                reveal && !chosen && !isCorrect && 'border-border opacity-60',
              )}
            >
              <span className="min-w-0 flex-1">{opt}</span>
              {reveal && isCorrect && <Check className="h-4 w-4 shrink-0 text-brote-green" />}
              {reveal && chosen && !isCorrect && <X className="h-4 w-4 shrink-0 text-brote-coral" />}
            </button>
          );
        })}
      </div>
      {picked !== null && <Explanation text={payload.explain} />}
    </Card>
  );
}

function TrueFalseCard({
  payload,
  picked,
  onPick,
}: {
  payload: TrueFalsePayload;
  picked: boolean | null;
  onPick: (v: boolean, correct: boolean) => void;
}) {
  const reveal = picked !== null;
  return (
    <Card className="p-5">
      <p className="font-display text-h3 font-bold leading-snug">{payload.statement}</p>
      <div className="mt-3 flex gap-2">
        {[true, false].map((v) => {
          const isCorrect = v === payload.answer;
          const chosen = picked === v;
          return (
            <button
              key={String(v)}
              disabled={reveal}
              onClick={() => onPick(v, isCorrect)}
              className={cn(
                'flex-1 rounded-card border p-3 text-small font-semibold transition-colors',
                !reveal && 'border-border bg-surface hover:border-primary/40',
                reveal && isCorrect && 'border-brote-green bg-brote-green/10',
                reveal && chosen && !isCorrect && 'border-brote-coral bg-brote-coral/10',
                reveal && !chosen && !isCorrect && 'border-border opacity-60',
              )}
            >
              {v ? 'Verdadero' : 'Falso'}
            </button>
          );
        })}
      </div>
      {reveal && <Explanation text={payload.explain} />}
    </Card>
  );
}

/** Shown for right AND wrong answers — the explanation is the lesson. */
function Explanation({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-card border border-border bg-surface-2 p-3 text-small leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}
