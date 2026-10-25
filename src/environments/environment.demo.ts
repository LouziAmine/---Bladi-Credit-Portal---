// Build démo GitHub Pages : aucun backend. Le faux backend (interceptor) sert
// les réponses depuis IndexedDB. Activé par `ng build --configuration demo`.
export const environment = {
  production: true,
  demo: true,
  apiUrl: '/api/v1',
};
