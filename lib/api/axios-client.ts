import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30_000,
  withCredentials: true,
});

// export const apiClient = createServerApi();
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODEzM2I0NGMyMjE5YTc1ZmE2ZmJjYyIsImlhdCI6MTc3MDE0NTAzMSwiZXhwIjoxODAxNjgxMDMxfQ.Ac66LkganW3LNGEPZsasEqd0LgOV8uNY7xI8o0G70G4
