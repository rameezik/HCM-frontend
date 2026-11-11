"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Panel, Form } from "@/components/WorkspaceUI";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import AiAvailability from "@/components/workspace/shared/AiAvailability";

export default function AssistantPage() {
  const aiStatus = useResource("/ai/status");
  const [history, setHistory] = useState([]);
  return (
    <Panel title="Ask your assistant">
      <AiAvailability resource={aiStatus} />
      <p className="mb-5 text-sm text-zinc-400">
        Answers use your role and data scope. The assistant cannot save or
        approve records.
      </p>
      <div aria-live="polite" className="mb-6 space-y-4">
        {history.map((message, index) => (
          <article
            key={index}
            className="rounded-xl border border-white/10 p-4"
          >
            <p className="mb-2 text-sm text-zinc-400">{message.question}</p>
            <span className="hcm-tag">AI-generated</span>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {message.answer}
            </p>
          </article>
        ))}
      </div>
      <Form
        fields={[
          {
            name: "message",
            label: "Question",
            type: "textarea",
            wide: true,
            maxLength: 4000,
          },
        ]}
        disabled={!aiStatus.data?.configured}
        submitLabel="Ask assistant"
        successMessage="Answer received."
        onSubmit={async (body) => {
          const result = await api("/ai/chat", {
            method: "POST",
            body: { ...body, mode: "chat" },
          });
          setHistory((previousMessages) => [
            ...previousMessages,
            { question: body.message, answer: result.answer },
          ]);
        }}
      />
    </Panel>
  );
}
