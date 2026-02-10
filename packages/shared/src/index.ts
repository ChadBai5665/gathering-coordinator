/**
 * @ontheway/shared - 碰个头 共享包
 * 统一导出所有常量、类型、工具函数
 */

// ── 常量 ──
export {
  GatheringStatus,
  GATHERING_STATUS_VALUES,
  ParticipantStatus,
  PARTICIPANT_STATUS_VALUES,
  VoteStatus,
  VOTE_STATUS_VALUES,
  MessageType,
  MESSAGE_TYPE_VALUES,
  TASTE_OPTIONS,
  MAX_TASTE_COUNT,
  MIN_TASTE_COUNT,
  ErrorCode,
  ERROR_MESSAGES,
} from './constants';
export type { TasteOption } from './constants';

// ── 类型 ──
export type {
  Gathering,
  CreateGatheringParams,
  JoinGatheringParams,
  GatheringDetail,
  Participant,
  RemindersSent,
  UpdateLocationParams,
  UpdateTastesParams,
  Restaurant,
  TravelInfo,
  SearchRestaurantParams,
  Vote,
  VoteRecord,
  CreateVoteParams,
  CastVoteParams,
  VoteDetail,
  Message,
  RealtimeMessagePayload,
  UserProfile,
  UserPreferences,
  WxLoginParams,
  AuthResponse,
  Location,
  NamedLocation,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  PaginationParams,
  PaginatedData,
  Timestamps,
  Optional,
} from './types';

// ── 工具函数 ──
export {
  generateInviteCode,
  isValidInviteCode,
  formatInviteCode,
  calculateCenter,
  calculateDistance,
  getDefaultCenter,
  isInChina,
  calculateDepartureTime,
  getTimeRemaining,
  formatCountdown,
  formatDuration,
  formatTime,
  isExpired,
  shouldRemindDeparture,
  validateNickname,
  validateTastes,
  validateGatheringName,
  validateLocation,
  isValidTaste,
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  GATHERING_NAME_MIN_LENGTH,
  GATHERING_NAME_MAX_LENGTH,
} from './utils';
export type { ValidationResult } from './utils';
