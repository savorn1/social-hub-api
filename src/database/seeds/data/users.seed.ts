import { Status } from '../../../common/enums/status.enum';

export interface UserSeed {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  status: Status;
}

export const SEED_USERS: UserSeed[] = [
  {
    email: 'admin@socialhub.com',
    password: 'Admin@1234',
    firstName: 'Super',
    lastName: 'Admin',
    status: Status.ACTIVE,
  },
  {
    email: 'manager@socialhub.com',
    password: 'Admin@1234',
    firstName: 'Sam',
    lastName: 'Manager',
    status: Status.ACTIVE,
  },
  {
    email: 'agent1@socialhub.com',
    password: 'Admin@1234',
    firstName: 'Alice',
    lastName: 'Agent',
    status: Status.ACTIVE,
  },
  {
    email: 'agent2@socialhub.com',
    password: 'Admin@1234',
    firstName: 'Bob',
    lastName: 'Agent',
    status: Status.ACTIVE,
  },
  {
    email: 'viewer@socialhub.com',
    password: 'Admin@1234',
    firstName: 'Eve',
    lastName: 'Viewer',
    status: Status.ACTIVE,
  },
];
