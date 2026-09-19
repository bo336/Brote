'use client';

import { useParams } from 'next/navigation';
import { AccountListPage } from '@/components/social/AccountListPage';

export default function SiguiendoPage() {
  const { username } = useParams<{ username: string }>();
  return <AccountListPage username={username} mode="following" />;
}
