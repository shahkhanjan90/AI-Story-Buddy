import { createApi } from './src/api/createApi.mjs';
import { apiConfig } from './src/api/config.mjs';

const app = createApi();

app.listen(apiConfig.port, () => {
  console.log(`Story API listening on http://localhost:${apiConfig.port}`);
});
