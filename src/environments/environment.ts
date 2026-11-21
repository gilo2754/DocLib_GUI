/**
 * Development configuration.
 *
 * `useMockApi: true` registers an in-app HTTP interceptor that simulates the
 * DocLib Spring Boot API (see `core/mock-api`). Set it to `false` and point
 * `apiUrl` to a running backend to use real data.
 */
export const environment = {
  production: false,
  useMockApi: true,
  apiUrl: 'http://localhost:8081/api/v1',
  adminApiUrl: 'http://localhost:8081/admin/api/v1',
  mockLatencyMs: 300,
};
