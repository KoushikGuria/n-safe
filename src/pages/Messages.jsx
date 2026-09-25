import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  subscribeToUserMessages, 
  updateMessageStatus,
  markAllMessagesAsRead 
} from '../services/messageService';
import { 
  MessageSquare, 
  Inbox, 
  Clock, 
  CheckCheck, 
  Filter, 
  Search,
  Sparkles,
  MailCheck,
  AlertCircle
} from 'lucide-react';

export default function Messages() {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'new', 'read'
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [actionError, setActionError] = useState(null);

  const userId = currentUser?.uid || userProfile?.userId;

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToUserMessages(
      userId,
      (items) => {
        setMessages(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching messages in Messages page:', err);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userId]);

  const handleToggleStatus = async (messageId, currentStatus) => {
    setActionError(null);
    const newStatus = currentStatus === 'new' ? 'read' : 'new';
    
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, status: newStatus } : m))
    );

    try {
      await updateMessageStatus(messageId, newStatus);
    } catch (err) {
      console.error('Failed to update message status:', err);
      // Revert optimistic update
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: currentStatus } : m))
      );
      setActionError(
        err.code === 'permission-denied'
          ? 'Firestore Permission Denied: Please ensure your Firestore security rules allow the recipient to update their messages.'
          : err.message || 'Failed to update message status.'
      );
    }
  };

  const handleMarkAllRead = async () => {
    setActionError(null);
    const unread = messages.filter((m) => m.status === 'new');
    if (unread.length === 0) return;

    const unreadIds = unread.map((m) => m.id);
    setIsMarkingAll(true);

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.status === 'new' ? { ...m, status: 'read' } : m))
    );

    try {
      await markAllMessagesAsRead(unreadIds);
    } catch (err) {
      console.error('Failed marking messages as read:', err);
      // Revert optimistic update
      setMessages((prev) =>
        prev.map((m) => (unreadIds.includes(m.id) ? { ...m, status: 'new' } : m))
      );
      setActionError(
        err.code === 'permission-denied'
          ? 'Firestore Permission Denied: Please ensure your Firestore security rules allow the recipient to update their messages.'
          : err.message || 'Failed to mark messages as read.'
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesFilter =
      filterStatus === 'all' ? true : msg.status === filterStatus;
    const matchesSearch =
      searchQuery.trim() === '' ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter((m) => m.status === 'new').length;

  return (
    <div className="page-container messages-page">
      {/* Page Header */}
      <div className="page-header-row animate-fade-down">
        <div>
          <span className="welcome-eyebrow">
            <Sparkles size={14} /> Visitor Communication
          </span>
          <h1 className="page-title">Received Messages</h1>
          <p className="page-subtitle">
            Messages anonymously submitted by visitors scanning your personal QR code.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="btn-secondary btn-sm"
          >
            {isMarkingAll ? (
              <>
                <span className="spinner-sm"></span>
                <span>Marking all read...</span>
              </>
            ) : (
              <>
                <MailCheck size={16} />
                <span>Mark all read</span>
              </>
            )}
          </button>
        )}
      </div>

      {actionError && (
        <div className="alert-box alert-error animate-fade-in" role="alert">
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="controls-bar card">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All <span className="tab-badge">{messages.length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filterStatus === 'new' ? 'active' : ''}`}
            onClick={() => setFilterStatus('new')}
          >
            New <span className="tab-badge unread">{unreadCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab ${filterStatus === 'read' ? 'active' : ''}`}
            onClick={() => setFilterStatus('read')}
          >
            Read <span className="tab-badge">{messages.length - unreadCount}</span>
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search within messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="messages-container">
        {loading ? (
          <div className="card loading-card">
            <div className="spinner-orbit">
              <div className="spinner-core"></div>
            </div>
            <p className="loader-text">Loading your inbox...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="card empty-inbox-card animate-fade-in">
            <div className="empty-icon-wrap">
              <Inbox size={48} className="text-indigo" />
            </div>
            <h3 className="empty-title">
              {searchQuery || filterStatus !== 'all'
                ? 'No matching messages found'
                : 'No messages received yet'}
            </h3>
            <p className="empty-text">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search query or switching filters.'
                : 'Share your QR code on business cards, stickers, or social profiles to receive messages directly here.'}
            </p>
          </div>
        ) : (
          <div className="messages-list">
            {filteredMessages.map((msg) => {
              const dateObj = msg.createdAt ? new Date(msg.createdAt) : new Date();
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <article 
                  key={msg.id} 
                  className={`message-card animate-fade-in ${msg.status === 'new' ? 'is-new' : ''}`}
                >
                  <div className="message-header">
                    <div className="flex-row items-center gap-2">
                      <div className="avatar-anon">
                        <MessageSquare size={16} />
                      </div>
                      <div>
                        <span className="sender-label">Anonymous Visitor</span>
                        <div className="message-timestamp">
                          <Clock size={12} />
                          <span>{formattedDate} at {formattedTime}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(msg.id, msg.status)}
                      className={`btn-status-toggle ${msg.status === 'new' ? 'btn-mark-read' : 'btn-mark-new'}`}
                      title={msg.status === 'new' ? 'Mark as read' : 'Mark as new'}
                    >
                      <CheckCheck size={15} />
                      <span>{msg.status === 'new' ? 'Mark Read' : 'Read'}</span>
                    </button>
                  </div>

                  <div className="message-content-box">
                    <p className="message-body-text">{msg.message}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
