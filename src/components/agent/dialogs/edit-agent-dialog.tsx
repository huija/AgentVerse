import React from "react";
import { useCallback } from "react";
import { useModal } from "@/components/ui/modal";
import { AgentForm } from "../agent-form";
import { Agent } from "@/types/agent";
import { useAgents } from "@/hooks/useAgents";
import { useBreakpointContext } from "@/contexts/breakpoint-context";
import { cn } from "@/lib/utils";

// 对话框内容组件
export interface EditAgentDialogContentProps {
  agent: Agent;
  onSubmit: (data: Partial<Agent>) => void;
  onClose: () => void;
}

export function EditAgentDialogContent({ 
  agent, 
  onSubmit, 
  onClose 
}: EditAgentDialogContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AgentForm
        open={true}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        onSubmit={onSubmit}
        initialData={agent}
      />
    </div>
  );
}

// 钩子函数，用于打开对话框
export function useEditAgentDialog() {
  const modal = useModal();
  const { updateAgent } = useAgents();
  const { isMobile } = useBreakpointContext();

  const openEditAgentDialog = useCallback((agent: Agent) => {
    modal.show({
      title: "编辑 Agent",
      content: (
        <EditAgentDialogContent 
          agent={agent} 
          onSubmit={(data) => {
            updateAgent(agent.id, { ...agent, ...data });
            modal.close();
          }}
          onClose={() => modal.close()}
        />
      ),
      // 使用 className 来控制样式
      className: cn(
        "overflow-hidden",
        isMobile 
          ? "w-[95vw] max-h-[90vh]" 
          : "sm:max-w-xl sm:max-h-[85vh]"
      ),
      // 不需要底部按钮
      showFooter: false
    });
  }, [modal, updateAgent, isMobile]);

  return {
    openEditAgentDialog
  };
}

// 导出组件
export const EditAgentDialog = {
  Content: EditAgentDialogContent,
  useEditAgentDialog
}; 