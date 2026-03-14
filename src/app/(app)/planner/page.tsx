"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Sparkles,
  Loader2,
  Circle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ListTodo,
} from "lucide-react";

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [newTask, setNewTask] = useState("");
  const [generatedMessage, setGeneratedMessage] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["planner"],
    queryFn: async () => {
      const res = await fetch("/api/planner");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const addTask = useMutation({
    mutationFn: async () => {
      await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTask }),
      });
    },
    onSuccess: () => {
      setNewTask("");
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  const generateSchedule = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
      if (data?.count) {
        setGeneratedMessage(`AI generated ${data.count} tasks for your schedule!`);
        setTimeout(() => setGeneratedMessage(""), 5000);
      }
    },
  });

  const incompleteTasks = tasks.filter((t: any) => !t.completed);
  const completedTasks = tasks.filter((t: any) => t.completed);
  const completedCount = completedTasks.length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const today = new Date().toISOString().split("T")[0];

  // Categorize incomplete tasks
  const overdueTasks = incompleteTasks.filter(
    (t: any) => t.dueDate && t.dueDate.split("T")[0] < today
  );
  const todayTasks = incompleteTasks.filter(
    (t: any) => t.dueDate && t.dueDate.split("T")[0] === today
  );
  const upcomingTasks = incompleteTasks.filter(
    (t: any) => t.dueDate && t.dueDate.split("T")[0] > today
  );
  const noDueDateTasks = incompleteTasks.filter((t: any) => !t.dueDate);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Planner</h1>
          <p className="text-muted-foreground">
            Track your progress toward competition day
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => generateSchedule.mutate()}
          disabled={generateSchedule.isPending}
        >
          {generateSchedule.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          AI Schedule
        </Button>
      </div>

      {/* AI Generated Message */}
      {generatedMessage && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">
              {generatedMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {tasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{completedCount} of {tasks.length} tasks complete</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Task */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && newTask.trim() && addTask.mutate()}
        />
        <Button onClick={() => addTask.mutate()} disabled={!newTask.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Overdue ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {overdueTasks.map((task: any) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask.mutate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      {todayTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Today ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayTasks.map((task: any) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask.mutate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming */}
      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Upcoming ({upcomingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcomingTasks.map((task: any) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask.mutate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Due Date */}
      {noDueDateTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4" /> No Due Date ({noDueDateTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {noDueDateTasks.map((task: any) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask.mutate} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Completed ({completedTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {completedTasks.slice(0, 10).map((task: any) => (
              <TaskItem key={task.id} task={task} onToggle={toggleTask.mutate} />
            ))}
            {completedTasks.length > 10 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                + {completedTasks.length - 10} more completed
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-1">No tasks yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add tasks manually or let AI generate a study schedule based on your projects
            </p>
            <Button
              onClick={() => generateSchedule.mutate()}
              disabled={generateSchedule.isPending}
            >
              {generateSchedule.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate AI Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
}: {
  task: any;
  onToggle: (args: { id: string; completed: boolean }) => void;
}) {
  const priorityColors: Record<string, string> = {
    LOW: "text-gray-500",
    MEDIUM: "text-blue-500",
    HIGH: "text-orange-500",
    URGENT: "text-red-500",
  };

  return (
    <div
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
      onClick={() => onToggle({ id: task.id, completed: !task.completed })}
    >
      {task.completed ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
      ) : (
        <Circle className={`h-5 w-5 shrink-0 ${priorityColors[task.priority] || ""}`} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground truncate">{task.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.priority && task.priority !== "MEDIUM" && (
          <Badge
            variant="outline"
            className={`text-[10px] ${priorityColors[task.priority] || ""}`}
          >
            {task.priority}
          </Badge>
        )}
        {task.aiGenerated && (
          <Badge variant="secondary" className="text-[10px]">AI</Badge>
        )}
      </div>
    </div>
  );
}
