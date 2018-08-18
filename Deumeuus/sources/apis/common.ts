export interface MastodonIDLimiter {
  /** Get a list of timelines with ID less than this value */
  max_id?: string;
  /** Get a list of timelines with ID greater than this value */
  since_id?: string;
  /** Maximum number of statuses on the requested timeline to get (Default 20, Max 40) */
  limit?: number;
}