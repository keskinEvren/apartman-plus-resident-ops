// Shared type interfaces for the application.
// Derived from actual tRPC router return shapes in src/server/routers/*.ts

// --- Auth / Login ---

/** User info returned by the auth.login mutation */
export interface LoginUser {
  id: string;
  email: string;
  name: string;
}

/** Membership row returned by the auth.login mutation (joined with roles) */
export interface MembershipInfo {
  membershipId: string;
  siteId: string;
  roleId: string;
  unitId: string | null;
  blockId: string | null;
  roleName: string | null;
}

/** Full response from auth.login */
export interface LoginSuccessData {
  token: string;
  user: LoginUser;
  memberships: MembershipInfo[];
}

// --- Tickets ---

/** Shape returned by ticket.listMyTickets and ticket.listStaffTickets */
export interface TicketListItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: string;
  blockId: string | null;
  unitId: string | null;
  createdAt: Date;
  assignedStaffUserId: string | null;
  reporter: {
    id: string | null;
    name: string | null;
  };
}

// --- Invitations ---

/** Shape returned by invitation.checkInvitation */
export interface InvitationDetails {
  id: string;
  siteId: string;
  roleId: string;
  unitId: string | null;
  token: string;
  email: string | null;
  unit: {
    unitNumber: string;
    blockName: string;
  } | null;
  role: {
    name: string;
  } | null;
}
