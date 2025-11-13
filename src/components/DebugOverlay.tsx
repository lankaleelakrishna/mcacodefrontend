import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function DebugOverlay() {
  const { user, token } = useAuth();
  const { items } = useCart();
  const [storageKeys, setStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('vasa-cart')) keys.push(k);
    }
    setStorageKeys(keys);
  }, [items, user, token]);

  return (
    <div style={{ position: 'fixed', right: 12, bottom: 12, zIndex: 9999 }}>
      <div style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 10, borderRadius: 8, fontSize: 12, minWidth: 260 }}>
        <div style={{ marginBottom: 6 }}><strong>Debug</strong></div>
        <div><strong>user.id:</strong> {String(user?.id ?? 'null')}</div>
        <div><strong>token:</strong> {token ? 'present' : 'none'}</div>
        <div style={{ marginTop: 6 }}><strong>cart items (in-memory):</strong> {items.length}</div>
        <div style={{ marginTop: 6 }}><strong>localStorage keys:</strong></div>
        <ul style={{ margin: 0, paddingLeft: 14 }}>
          {storageKeys.map(k => <li key={k}>{k}</li>)}
        </ul>
      </div>
    </div>
  );
}
