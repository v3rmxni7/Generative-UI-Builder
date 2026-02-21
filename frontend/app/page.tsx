"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { useGenerationStream } from "@/hooks/useGenerationStream";
import ControlPanel from "@/components/ControlPanel";
import OutputPanel from "@/components/OutputPanel";

export default function HomePage() {
  const {
    dsl,
    code,
    status,
    agents,
    plan,
    reflection,
    generate,
    cancel,
  } = useGenerationStream();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Left: controls + agent timeline */}
        <Panel defaultSize={28} minSize={22} maxSize={40}>
          <ControlPanel
            status={status}
            agents={agents}
            plan={plan}
            reflection={reflection}
            onGenerate={generate}
            onCancel={cancel}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-zinc-800 hover:bg-blue-600 transition-colors cursor-col-resize" />

        {/* Right: tabbed output */}
        <Panel minSize={40}>
          <OutputPanel
            dsl={dsl}
            code={code}
            status={status}
            reflection={reflection}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}
