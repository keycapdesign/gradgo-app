import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Checklist, ChecklistItem } from './types';
import { studentContactQueryOptions } from '@/utils/student-contact';
import { createClient } from '@/utils/supabase/client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface GraduationChecklistProps {
  todoItems: ChecklistItem[];
  initialChecklist: Checklist;
  contactId?: number | null | undefined;
}

export function GraduationChecklist({
  todoItems,
  initialChecklist,
  contactId,
}: GraduationChecklistProps) {
  const queryClient = useQueryClient();
  const [checklist, setChecklist] = useState<Checklist>(initialChecklist || {});

  // Mutation to update checklist
  const mutation = useMutation({
    mutationFn: async (updatedChecklist: Record<string, boolean>) => {
      if (!contactId) throw new Error('Contact ID is required');

      const supabase = createClient();
      const { error } = await supabase
        .from('contacts')
        .update({ todo_checklist: updatedChecklist })
        .eq('id', contactId);

      if (error) throw new Error(error.message);
      return updatedChecklist;
    },
    onMutate: (updatedChecklist) => {
      setChecklist(updatedChecklist);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentContactQueryOptions().queryKey });
    },
    onError: () => {
      // Optionally show a toast or revert optimistic update
      queryClient.invalidateQueries({ queryKey: studentContactQueryOptions().queryKey });
    },
  });

  const handleCheck = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    mutation.mutate(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Your Graduation Checklist</CardTitle>
        <CardDescription>Track your progress through the graduation process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todoItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center bg-background p-3 rounded-lg space-x-2"
              >
                <Checkbox
                  id={item.id}
                  checked={!!checklist[item.id]}
                  onCheckedChange={() => handleCheck(item.id)}
                />
                <label
                  htmlFor={item.id}
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <ItemIcon className="h-4 w-4 text-primary" />
                  {item.link ? (
                    <Link
                      to={item.link}
                      className="text-foreground underline cursor-pointer hover:text-foreground/80"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
