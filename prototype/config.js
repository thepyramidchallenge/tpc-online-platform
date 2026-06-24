/* Prototype config.
 * apiUrl points at the Cloud Run SheetsBackend (writes users/sessions/bookmarks
 * via a service account). Questions render from the bundled data.js. No Google
 * Sheet IDs live in the frontend — all sheet access is server-side on Cloud Run.
 * Leave apiUrl "" to run fully offline (bundled questions + localStorage only). */
window.TPC_CONFIG = {
  apiUrl: "https://tpc-api-167766870558.asia-east2.run.app/"
};
