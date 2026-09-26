'use client';

import { useCallback, useMemo, useRef } from 'react';

import type { CharacterController, PropCollider } from '../control/CharacterController';
import type { FollowCamera } from '../control/FollowCamera';

/**
 * Props and trees become things you walk around, not through — and things the
 * camera refuses to sit inside.
 *
 * Two sources, one list, because they answer the same two questions. Trees were
 * in neither: you walked through the trunks, and standing in La Arboleda put
 * the lens inside one, filling the frame with bark.
 *
 * `all()` exists because the camera is created *after* its children have
 * already reported. React runs a child's effects before its parent's, so
 * Vegetation and Props both call in while `cameraRef.current` is still null;
 * the effect that builds the boom asks for the list again rather than waiting
 * for the next thing to move.
 */
export interface Colliders {
  all(): PropCollider[];
  onProps(colliders: PropCollider[]): void;
  onTrees(colliders: PropCollider[]): void;
  /** The game layer's stations and characters. */
  onGame(colliders: PropCollider[]): void;
}

export function useColliders(
  controller: CharacterController | null,
  cameraRef: React.MutableRefObject<FollowCamera | null>,
): Colliders {
  const props = useRef<PropCollider[]>([]);
  const trees = useRef<PropCollider[]>([]);
  const game = useRef<PropCollider[]>([]);

  const all = useCallback(() => [...props.current, ...trees.current, ...game.current], []);
  const push = useCallback(() => {
    const list = all();
    controller?.setColliders(list);
    cameraRef.current?.setOccluders(list);
  }, [all, controller, cameraRef]);

  const onProps = useCallback(
    (colliders: PropCollider[]) => {
      props.current = colliders;
      push();
    },
    [push],
  );
  const onTrees = useCallback(
    (colliders: PropCollider[]) => {
      trees.current = colliders;
      push();
    },
    [push],
  );

  /**
   * **Memoised, and it has to be.** `World`'s spawn effect lists this object in
   * its dependencies. Returned fresh, every re-render of `World` counted as a
   * change: the effect re-ran, called `resetPlayerTransform` and built a new
   * camera — so a camera drag, which wakes the render loop and re-renders the
   * tree, teleported Pip back to the spawn mid-walk.
   */
  const onGame = useCallback(
    (colliders: PropCollider[]) => {
      game.current = colliders;
      push();
    },
    [push],
  );
  return useMemo(() => ({ all, onProps, onTrees, onGame }), [all, onProps, onTrees, onGame]);
}
