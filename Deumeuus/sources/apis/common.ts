export interface MastodonIDLimiter {
  /** Get a list of items with ID less than this value */
  max_id?: string;
  /** Get a list of items with ID greater than this value */
  since_id?: string;
  /** Maximum number of items to get */
  limit?: number;
}
