export interface ClientInvitationPreviewResponse {
  email: string;
  enterpriseName: string | null;
  demandReference: string | null;
  expiresAt: string;
}

export interface AcceptInvitationRequest {
  username: string;
  password: string;
}
