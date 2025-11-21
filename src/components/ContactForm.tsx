import React, { useState } from 'react';

const ContactForm: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (result.success) {
        setStatus('Message sent successfully!');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('Failed to send message: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      setStatus('Failed to send message: ' + err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto' }}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" required style={{ width: '100%', marginBottom: 10, padding: 8 }} />
      <input name="email" value={form.email} onChange={handleChange} placeholder="your.email@example.com" required style={{ width: '100%', marginBottom: 10, padding: 8 }} />
      <input name="subject" value={form.subject} onChange={handleChange} placeholder="What is this about?" required style={{ width: '100%', marginBottom: 10, padding: 8 }} />
      <textarea name="message" value={form.message} onChange={handleChange} placeholder="Your message here..." required style={{ width: '100%', marginBottom: 10, padding: 8, minHeight: 100 }} />
      <button type="submit" style={{ width: '100%', background: '#16a34a', color: 'white', padding: 12, fontWeight: 'bold', border: 'none', borderRadius: 4 }}>Send Message</button>
      {status && <div style={{ marginTop: 10 }}>{status}</div>}
    </form>
  );
};

export default ContactForm;
