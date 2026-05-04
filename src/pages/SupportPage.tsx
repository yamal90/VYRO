import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';
import { useSupportTickets } from '../hooks/useSupportTickets';

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, pushNotice } = useApp();
  const { tickets, loading, createTicket } = useSupportTickets(
    currentUser?.id,
    false,
  );

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    const result = await createTicket(subject.trim(), message.trim());
    setSending(false);
    if (result.success) {
      pushNotice('success', t('support.ticketSent'));
      setSubject('');
      setMessage('');
    } else {
      pushNotice('error', result.message);
    }
  };

  const statusIcon = (status: string) => {
    if (status === 'open') return <Clock size={14} className="text-amber-400" />;
    if (status === 'replied') return <MessageCircle size={14} className="text-green-400" />;
    return <CheckCircle size={14} className="text-slate-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'open') return t('support.statusOpen');
    if (status === 'replied') return t('support.statusReplied');
    return t('support.statusClosed');
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/12 rounded-full blur-3xl" />
        </div>
        <div className="gradient-dark px-4 pt-12 pb-6 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-white tracking-wider">
                {t('support.title')}
              </h1>
              <p className="text-white/50 text-xs">{t('support.subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Form - always visible */}
      <div className="px-4 mt-4">
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-[#0c101c] to-[#111827] border border-amber-500/20 rounded-2xl p-4 space-y-3"
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Send size={14} className="text-amber-400" />
            {t('support.newTicket')}
          </h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              {t('support.subjectLabel')}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('support.subjectPlaceholder')}
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              {t('support.messageLabel')}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('support.messagePlaceholder')}
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:border-amber-500/50 focus:outline-none resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending || !subject.trim() || !message.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#06080f] font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={16} />
            {sending ? t('support.sending') : t('support.send')}
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            {t('support.adminOnly', 'Il tuo messaggio arriverà direttamente all\'admin')}
          </p>
        </form>
      </div>

      {/* Tickets List */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <MessageSquare size={16} className="text-amber-400" />
          {t('support.myTickets')}
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{t('support.noTickets')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                className="bg-gradient-to-br from-[#0c101c] to-[#111827] border border-white/8 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                  }
                  className="w-full px-4 py-3 flex items-center justify-between text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(ticket.status)}
                      <span className="text-xs font-medium text-slate-400">
                        {statusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(ticket.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {expandedTicket === ticket.id ? (
                    <ChevronUp size={16} className="text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedTicket === ticket.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/6 overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-3">
                        {/* User message */}
                        <div>
                          <p className="text-[10px] text-amber-400 font-semibold mb-1">
                            {t('support.yourMessage')}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {ticket.message}
                          </p>
                        </div>

                        {/* Admin reply */}
                        {ticket.admin_reply && (
                          <div className="bg-green-500/5 border border-green-500/15 rounded-lg p-3">
                            <p className="text-[10px] text-green-400 font-semibold mb-1">
                              {t('support.adminReply')}
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {ticket.admin_reply}
                            </p>
                            {ticket.admin_replied_at && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(ticket.admin_replied_at).toLocaleDateString(
                                  'it-IT',
                                  {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  },
                                )}
                              </p>
                            )}
                          </div>
                        )}

                        {ticket.status === 'open' && (
                          <p className="text-[10px] text-slate-500 italic">
                            {t('support.waitingReply')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
