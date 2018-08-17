﻿export interface Account {
  /** The username of the account */
  username: string;
  /** Equals username for local users, includes @domain for remote ones */
  acct: string;
  /** The account's display name */
  display_name: string;
  /** Boolean for when the account cannot be followed without waiting for approval first */
  locked: string;
  /** The time the account was created */
  created_at: string;
  /** The number of followers for the account */
  followers_count: number;
  /** The number of accounts the given account is following */
  following_count: number;
  /** The number of statuses the account has made */
  statuses_count: number;
  /** Biography of user */
  note: string;
  /** URL of the user's profile page (can be remote) */
  url: string;
  /** URL to the avatar image */
  avatar: string;
  /** URL to the avatar static image(gif) */
  avatar_static: string;
  /** URL to the header image */
  header: string;
  /** URL to the header static image(gif) */
  header_static: string;
  /** Array of Emoji in account username and note */
  emojis: any[];
  /** If the owner decided to switch accounts, new account is in this attribute */
  moved: string | null;
  /** Array of profile metadata field, each element has 'name' and 'value' */
  fields: any[] | null;
  /** Boolean to indicate that the account performs automated actions */
  bot: string | null;
}

export interface Status {
  /** The ID of the status */
  id: string;
  /** A Fediverse-unique resource ID */
  uri: string;
  /** URL to the status page (can be remote) */
  url: string;
  /** The {@link Account} which posted the status */
  account: Account;
  /** `null` or the ID of the status it replies to */
  in_reply_to_id: string;
  /** `null` or the ID of the account it replies to */
  in_reply_to_account_id: string;
  /** `null` or the reblogged {@link Status} */
  reblog: Status | null;
  /** Body of the status; this will contain HTML (remote HTML already sanitized) */
  content: string;
  /** The time the status was created */
  created_at: string;
  /** An array of {@link Emoji} */
  emojis: any[];
  /** The number of reblogs for the status */
  reblogs_count: string;
  /** The number of favourites for the status */
  favourites_count: string;
  /** Whether the authenticated user has reblogged the status */
  reblogged: boolean;
  /** Whether the authenticated user has favourited the status */
  favourited: boolean;
  /** Whether the authenticated user has muted the conversation this status from */
  muted: boolean;
  /** Whether media attachments should be hidden by default */
  sensitive: boolean;
  /** If not empty, warning text that should be displayed before the actual content */
  spoiler_text: string;
  /** One of: `public`, `unlisted`, `private`, `direct` */
  visibility: "public" | "unlisted" | "private" | "direct";
  /** An array of {@link Attachments} */
  media_attachments: any[];
  /** An array of {@link Mentions} */
  mentions: any[];
  /** An array of {@link Tags} */
  tags: any[];
  /** {@link Application} from which the status was posted */
  application: any;
  /** The detected language for the status, if detected */
  language: string;
  /** Whether this is the pinned status for the account that posted it */
  pinned: boolean;
}