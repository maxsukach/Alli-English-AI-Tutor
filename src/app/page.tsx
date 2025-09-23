"use client";

import Image from "next/image";
import SignupDemoClient from "@/components/untitled/SignupDemoClient";
import { subscribeAction } from "./actions/subscribe";
import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus(null);
    // call server action
    // subscribeAction returns { success, message }
    const res = await subscribeAction(formData as FormData);
    if (res.success) setStatus('ok');
    else setStatus(res.message ?? 'error');
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js Logo"
          width={120}
          height={24}
          priority
        />
      </div>

      <section className="max-w-xl">
        <h2 className="text-lg font-semibold mb-2">Subscribe (Server Action)</h2>

        <form action={handleSubmit} className="flex gap-2">
          <input name="email" type="email" placeholder="you@example.com" className="flex-1 border rounded px-3 py-2" />
          <button type="submit" className="rounded bg-blue-600 text-white px-3 py-2">Subscribe</button>
        </form>

  {status === 'ok' && <p className="mt-2 text-green-600">Thanks — you&apos;re subscribed.</p>}
        {status && status !== 'ok' && <p className="mt-2 text-red-600">{status}</p>}
      </section>

      {/* Демо блок Untitled UI, рендериться з клієнтського врапера */}
      <SignupDemoClient />
    </main>
  );
}
