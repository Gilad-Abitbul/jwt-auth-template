import { UserService } from '../../src/services/user.service';
import User from '../../src/models/user';
import { UserDocument } from '../../src/models/user';

jest.mock('../../src/models/user');

describe('UserService', () => {
  const mockSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createUser should create and save a user', async () => {
    (User as unknown as jest.Mock).mockImplementation(() => ({ save: mockSave }));
    const data = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'secret123',
    };

    await UserService.createUser(data);
    expect(User).toHaveBeenCalledWith(data);
    expect(mockSave).toHaveBeenCalled();
  });

  it('getUserByEmail should call User.findOne with correct email', async () => {
    const mockFindOne = jest.fn();
    (User as any).findOne = mockFindOne;
    await UserService.getUserByEmail('test@example.com');

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('getUserById should call User.findById with correct ID', async () => {
    const mockFindById = jest.fn();
    (User as any).findById = mockFindById;
    await UserService.getUserById('user123');

    expect(mockFindById).toHaveBeenCalledWith('user123');
  });

  it('changePassword should update password and save user', async () => {
    const user = { password: 'oldPass', save: mockSave } as unknown as UserDocument;
    await UserService.changePassword(user, 'newHash123');

    expect(user.password).toBe('newHash123');
    expect(mockSave).toHaveBeenCalled();
  });

  it('setEmailVerified should update verified and save user', async () => {
    const user = { verified: false, save: mockSave } as unknown as UserDocument;
    await UserService.setEmailVerified(user, true);

    expect(user.verified).toBe(true);
    expect(mockSave).toHaveBeenCalled();
  });
});