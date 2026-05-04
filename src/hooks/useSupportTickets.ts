import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SupportTicketRow } from '../store/db-types';

interface TicketWithUser extends SupportTicketRow {
  profiles?: { username: string; email: string } | null;
}

export function useSupportTickets(userId: string | undefined, isAdmin: boolean) {
  const [tickets, setTickets] = useState<TicketWithUser[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!supabase || !userId) return;
    setLoading(true);
    try {
      if (isAdmin) {
        const { data } = await supabase
          .from('support_tickets')
          .select('*, profiles:user_id(username, email)')
          .order('created_at', { ascending: false });
        setTickets((data as TicketWithUser[]) ?? []);
      } else {
        const { data } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        setTickets((data as TicketWithUser[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => {
    void fetchTickets(); // eslint-disable-line react-hooks/set-state-in-effect -- initial data fetch on mount
  }, [fetchTickets]);

  const createTicket = useCallback(
    async (subject: string, message: string): Promise<{ success: boolean; message: string }> => {
      if (!supabase || !userId) return { success: false, message: 'Non autenticato.' };
      const { error } = await supabase.from('support_tickets').insert({
        user_id: userId,
        subject,
        message,
      });
      if (error) return { success: false, message: error.message };
      await fetchTickets();
      return { success: true, message: 'Ticket inviato con successo.' };
    },
    [userId, fetchTickets],
  );

  const replyToTicket = useCallback(
    async (ticketId: string, reply: string): Promise<{ success: boolean; message: string }> => {
      if (!supabase || !isAdmin) return { success: false, message: 'Non autorizzato.' };
      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_reply: reply,
          admin_replied_at: new Date().toISOString(),
          status: 'replied',
        })
        .eq('id', ticketId);
      if (error) return { success: false, message: error.message };
      await fetchTickets();
      return { success: true, message: 'Risposta inviata.' };
    },
    [isAdmin, fetchTickets],
  );

  const closeTicket = useCallback(
    async (ticketId: string): Promise<{ success: boolean; message: string }> => {
      if (!supabase) return { success: false, message: 'Non configurato.' };
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);
      if (error) return { success: false, message: error.message };
      await fetchTickets();
      return { success: true, message: 'Ticket chiuso.' };
    },
    [fetchTickets],
  );

  return { tickets, loading, fetchTickets, createTicket, replyToTicket, closeTicket };
}
