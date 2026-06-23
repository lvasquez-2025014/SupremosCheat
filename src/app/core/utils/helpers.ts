export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

export function getTimeAgo(timestamp: string | Date): string {
  if (!timestamp) return '';
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Ahora';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString('es-ES');
}

export function getAvatarGradient(index: number): string {
  const grads = ['us-avatar-g1', 'us-avatar-g2', 'us-avatar-g3', 'us-avatar-g4', 'us-avatar-g5'];
  return grads[index % grads.length];
}

const colorPalette = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e84393', '#00b894', '#6c5ce7',
  '#fd79a8', '#00cec9', '#a29bfe', '#ffeaa7', '#fab1a0',
  '#74b9ff', '#55efc4', '#ff7675', '#fdcb6e', '#a29bfe',
];

const userColors: Record<string, string> = {};

export function getUserColor(name: string): string {
  if (!name) return colorPalette[0];
  if (userColors[name]) return userColors[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colorPalette.length;
  userColors[name] = colorPalette[idx];
  return userColors[name];
}

export function getRoleLabel(role: string): string {
  if (role === 'superadmin') return 'SUPER ADMIN';
  if (role === 'admin') return 'ADMIN';
  if (role === 'vendedor') return 'VENDEDOR';
  return 'CLIENTE';
}

export function getRoleBadgeClass(role: string): string {
  if (role === 'superadmin') return 'badge-superadmin';
  if (role === 'admin') return 'badge-admin';
  if (role === 'vendedor') return 'badge-vendor';
  return 'badge-client';
}
