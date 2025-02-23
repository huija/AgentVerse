import { AddAgentDialogContent } from "@/components/agent/add-agent-dialog/add-agent-dialog-content";
import { ChatArea } from "@/components/chat/chat-area";
import { ThemeProvider, useTheme } from "@/components/common/theme";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { DiscussionController } from "@/components/discussion/control/discussion-controller";
import { DiscussionList } from "@/components/discussion/list/discussion-list";
import { MemberList } from "@/components/discussion/member/member-list";
import { ActivityBar } from "@/components/layout/activity-bar";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { ResponsiveContainer } from "@/components/layout/responsive-container";
import { useSettingsDialog } from "@/components/settings/settings-dialog";
import { ModalProvider } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { UI_PERSIST_KEYS } from "@/config/ui-persist";
import { useBreakpointContext } from "@/contexts/breakpoint-context";
import { useAgents } from "@/hooks/useAgents";
import { useDiscussions } from "@/hooks/useDiscussions";
import { useMessages } from "@/hooks/useMessages";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { cn } from "@/lib/utils";
import { discussionControlService } from "@/services/discussion-control.service";
import { Discussion, NormalMessage } from "@/types/discussion";
import { useEffect, useState } from "react";
import { useBeanState } from "rx-nested-bean";

// 场景类型
type Scene = "discussions" | "chat" | "agents" | "settings";

function AppContent() {
  const { isDesktop, isMobile } = useBreakpointContext();
  const { rootClassName } = useTheme();
  const { getAgentName, getAgentAvatar } = useAgents();
  const { messages, addMessage } = useMessages();
  const { currentDiscussion, clearMessages } = useDiscussions();
  const [currentScene, setCurrentScene] = useState<Scene>("discussions");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMembersForDesktop, setShowMembersForDesktop] = usePersistedState(
    false,
    {
      key: UI_PERSIST_KEYS.DISCUSSION.MEMBER_PANEL_VISIBLE,
      version: 1,
    }
  );
  const showDesktopMembers = isDesktop && showMembersForDesktop;
  const { data: currentDiscussionId } = useBeanState(
    discussionControlService.currentDiscussionIdBean
  );
  const { data: isPaused, set: setIsPaused } = useBeanState(
    discussionControlService.isPausedBean
  );
  const status = isPaused ? "paused" : "active";
  const { height } = useViewportHeight();
  const { openSettingsDialog } = useSettingsDialog();

  // 处理场景切换
  useEffect(() => {
    if (currentDiscussion && isMobile) {
      setCurrentScene("chat");
    }
  }, [currentDiscussion, isMobile]);

  const handleStatusChange = (status: Discussion["status"]) => {
    setIsPaused(status === "paused");
  };

  const handleToggleMembers = () => {
    if (!isMobile) {
      setShowMembersForDesktop(!showMembersForDesktop);
    } else {
      setCurrentScene("agents");
    }
  };

  const handleMessage = async (content: string, agentId: string) => {
    const agentMessage = await addMessage({
      content,
      agentId,
      type: "text",
    });
    if (messages.length === 0) {
      discussionControlService.setTopic(content);
    }
    if (agentMessage) discussionControlService.onMessage(agentMessage);
  };

  useEffect(() => {
    if (messages.length > 0) {
      discussionControlService.setTopic((messages[0] as NormalMessage).content);
    }
    discussionControlService.setMessages(messages);
  }, [messages]);

  const handleSelectDiscussion = () => {
    if (!isDesktop) {
      setShowMobileSidebar(false);
      setCurrentScene("chat");
    }
  };

  // 渲染当前场景内容
  const renderSceneContent = () => {
    if (currentScene === "chat" && currentDiscussion) {
      return (
        <div className="flex flex-col h-full">
          <MobileHeader
            onToggleSidebar={() => setCurrentScene("discussions")}
            className="lg:hidden flex-none"
            title={currentDiscussion.title || "讨论系统"}
            status={status}
            onStatusChange={handleStatusChange}
            onManageMembers={handleToggleMembers}
            onOpenSettings={() => openSettingsDialog()}
            onClearMessages={() => {
              if (currentDiscussion) {
                clearMessages(currentDiscussion.id);
              }
            }}
          />
          <div className="flex-1 min-h-0">
            <ChatArea
              key={currentDiscussionId}
              messages={messages}
              onSendMessage={handleMessage}
              getAgentName={getAgentName}
              getAgentAvatar={getAgentAvatar}
              onStartDiscussion={() => {
                if (status === "paused") {
                  handleStatusChange("active");
                }
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 min-h-0">
          {currentScene === "agents" ? (
            <div className="h-full p-4 overflow-y-auto">
              <AddAgentDialogContent />
            </div>
          ) : currentScene === "settings" ? (
            <div className="h-full overflow-y-auto">
              <div className="space-y-6 p-4">
                {/* 通用 */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium">通用</h2>
                  <div className="space-y-4 rounded-lg border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">深色模式</div>
                        <div className="text-sm text-muted-foreground">切换深色/浅色主题</div>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                {/* 讨论设置 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">讨论设置</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openSettingsDialog}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      高级设置
                    </Button>
                  </div>
                  <div className="space-y-4 rounded-lg border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">自动滚动</div>
                        <div className="text-sm text-muted-foreground">新消息时自动滚动到底部</div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">自动标题</div>
                        <div className="text-sm text-muted-foreground">根据首条消息自动设置讨论标题</div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                {/* 关于 */}
                <div className="space-y-3">
                  <h2 className="text-lg font-medium">关于</h2>
                  <div className="space-y-4 rounded-lg border bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">版本</div>
                        <div className="text-sm text-muted-foreground">当前版本 1.0.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <DiscussionList onSelectDiscussion={handleSelectDiscussion} />
          )}
        </div>
        {/* 只在主场景页面显示底部导航 */}
        {currentScene !== "chat" && (
          <MobileBottomBar
            currentScene={currentScene}
            onSceneChange={setCurrentScene}
            className="lg:hidden"
          />
        )}
      </div>
    );
  };

  // 桌面端布局
  if (isDesktop) {
    return (
      <div className="fixed inset-0 flex flex-col" style={{ height }}>
        <div className={cn(rootClassName, "flex flex-col h-full")}>
          <div className="flex-1 min-h-0 flex">
            <ActivityBar className="flex" />
            <div className="flex-1 flex justify-center w-full">
              <div className="w-full max-w-[1600px]">
                <ResponsiveContainer
                  sidebarContent={
                    <div className="h-full bg-card">
                      <DiscussionList onSelectDiscussion={handleSelectDiscussion} />
                    </div>
                  }
                  mainContent={
                    <div className="flex flex-col h-full">
                      <DiscussionController
                        status={status}
                        onSendMessage={addMessage}
                        onToggleMembers={handleToggleMembers}
                        enableSettings={false}
                      />
                      <div className="flex-1 min-h-0">
                        <ChatArea
                          key={currentDiscussionId}
                          messages={messages}
                          onSendMessage={handleMessage}
                          getAgentName={getAgentName}
                          getAgentAvatar={getAgentAvatar}
                        />
                      </div>
                    </div>
                  }
                  showMobileSidebar={showMobileSidebar}
                  onMobileSidebarChange={setShowMobileSidebar}
                />
              </div>
            </div>
            {showDesktopMembers && (
              <div className="w-80 flex-none border-l border-border bg-card">
                <div className="p-4 h-full">
                  <MemberList />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 移动端布局
  return (
    <div className="fixed inset-0 flex flex-col" style={{ height }}>
      <div className={cn(rootClassName, "flex flex-col h-full")}>
        {renderSceneContent()}
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </ThemeProvider>
  );
}
