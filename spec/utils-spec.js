/** @babel */

import fs from 'fs';
import Git from 'git-wrapper';
import utils from '../lib/utils';

describe('Utils', () => {
  describe('findRepo', () => {
    it('should find the git repo', () => {
      spyOn(fs, 'existsSync').andCallFake(path => path === '/fakeRoot/.git');
      const repoPath = utils.findRepo('/fakeRoot/lib/utils/');
      expect(repoPath).toEqual('/fakeRoot/.git');
    });
  });

  describe('getCommitLink', () => {
    it('should provide a correct link for github', async () => {
      spyOn(utils, 'findRepo').andReturn('/.git');
      spyOn(Git.prototype, 'exec').andCallFake((cmd, options, args, callback) => {
        if (cmd === 'config' && args[0] === 'remote.origin.url') {
          return callback(null, 'https://github.com/baldurh/atom-status-bar-blame.git');
        }
        return callback(null);
      });
      const link = await utils.getCommitLink('somefile.txt', '12345678');
      expect(link).toEqual('https://github.com/baldurh/atom-status-bar-blame/commit/12345678');
    });

    it('should provide a correct link', async () => {
      spyOn(utils, 'findRepo').andReturn('/.git');
      spyOn(Git.prototype, 'exec').andCallFake((cmd, options, args, callback) => {
        if (cmd === 'config' && args[0] === 'remote.origin.url') {
          return callback(null, 'git@gitlab.hidden.dom:eid/broncode.git');
        }
        return callback(null);
      });
      const link = await utils.getCommitLink('somefile.txt', '12345678');
      expect(link).toEqual('http://gitlab.hidden.dom/eid/broncode/commit/12345678');
    });
  });

  describe('getCommit', () => {
    beforeEach(() => {
      spyOn(utils, 'findRepo').andReturn('/.git');
      spyOn(Git.prototype, 'exec').andCallFake((cmd, options, args, callback) => {
        if (cmd === 'show' && args[0] === '12345678') {
          return callback(null, `someone@wherever.com
Some One
Subject Line

Line 1
Line 2`);
        }
        return callback(null);
      });
    });

    it('should return null', async () => {
      const commit = await utils.getCommit('somefile.txt', '11111111');
      expect(commit).toBe(null);
    });

    it('should return a valid commit object', async () => {
      const commit = await utils.getCommit('somefile.txt', '12345678');
      expect(commit).toEqual({
        email: 'someone@wherever.com',
        author: 'Some One',
        subject: 'Subject Line',
        message: 'Line 1\nLine 2',
      });
    });
  });

  describe('isCommitted', () => {
    it('should return true', () => {
      expect(utils.isCommitted('12345678')).toBe(true);
    });

    it('should return false', () => {
      expect(utils.isCommitted('00000000')).toBe(false);
    });
  });
});
