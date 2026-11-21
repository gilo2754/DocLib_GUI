/** Production / demo build (GitHub Pages): no backend, simulated API. */
export const environment = {
  production: true,
  useMockApi: true,
  apiUrl: '/api/v1',
  adminApiUrl: '/admin/api/v1',
  mockLatencyMs: 250,
};
