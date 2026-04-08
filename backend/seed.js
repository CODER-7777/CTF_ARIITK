const mongoose = require('mongoose');
const Level = require('./models/Level');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyberpunk-ctf');

const levels = [
  {
    level: 1, type: 'bandit', name: 'Permission Probe', category: 'Linux', difficulty: 1, points: 50,
    description: 'Find a readable file in the home directory owned by root.',
    objective: 'Find the proof token hidden in a file with restrictive permissions.',
    challengeData: 'Inside container: inspect /bandit/l1 and locate the token.',
    entryCommand: 'bash', validationMode: 'flag', expectedFlag: 'bandit{perm_probe_1}',
    hints: ['Use ls -la first.', 'Use find with -readable.', 'cat the file that only has r-- for your user.'],
    walkthrough: 'find /bandit/l1 -type f -readable 2>/dev/null',
    prerequisites: [], maxSessionMinutes: 20
  },
  {
    level: 2, type: 'bandit', name: 'Dotfile Hunt', category: 'Linux', difficulty: 1, points: 60,
    description: 'Token is inside a hidden file deep in nested dirs.', objective: 'Recover hidden dotfile token.',
    challengeData: 'Search /bandit/l2 recursively.', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{dotfile_hunt_2}', hints: ['ls -la', 'find /bandit/l2 -name ".*"'], walkthrough: 'find + cat',
    prerequisites: [1], maxSessionMinutes: 20
  },
  {
    level: 3, type: 'bandit', name: 'Grep Pipeline', category: 'Linux', difficulty: 1, points: 70,
    description: 'Huge log file with one line containing TOKEN=', objective: 'Extract TOKEN value from log.',
    challengeData: 'File path: /bandit/l3/access.log', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{grep_pipeline_3}', hints: ['grep TOKEN=', 'Use cut or awk to isolate value'],
    walkthrough: 'grep TOKEN= /bandit/l3/access.log | tail -1', prerequisites: [2], maxSessionMinutes: 20
  },
  {
    level: 4, type: 'bandit', name: 'Archive Stack', category: 'Archives', difficulty: 2, points: 80,
    description: 'Multiple nested archives hide the proof.', objective: 'Unpack nested archives and read token.',
    challengeData: 'Start with /bandit/l4/stack.tar.gz', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{archive_stack_4}', hints: ['Use file to inspect each layer', 'tar, gzip, bzip2 appear in sequence'],
    walkthrough: 'Unpack recursively with temp dir', prerequisites: [3], maxSessionMinutes: 25
  },
  {
    level: 5, type: 'bandit', name: 'Strings Binary', category: 'Binary', difficulty: 2, points: 90,
    description: 'A stripped ELF binary contains an embedded token.', objective: 'Extract token from binary.',
    challengeData: 'Target: /bandit/l5/agent.bin', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{strings_binary_5}', hints: ['Try strings', 'Pipe through grep bandit{'],
    walkthrough: 'strings /bandit/l5/agent.bin | grep bandit', prerequisites: [4], maxSessionMinutes: 20
  },
  {
    level: 6, type: 'bandit', name: 'Cron Clue', category: 'Linux', difficulty: 2, points: 100,
    description: 'Cron job writes token periodically in tmp.', objective: 'Inspect cron config and read generated token.',
    challengeData: 'Cron metadata in /etc/cron.d/l6job', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{cron_clue_6}', hints: ['cat /etc/cron.d/l6job', 'Check output file path from cron script'],
    walkthrough: 'trace cron script output in /tmp', prerequisites: [5], maxSessionMinutes: 25
  },
  {
    level: 7, type: 'bandit', name: 'Port Knocking', category: 'Network', difficulty: 2, points: 110,
    description: 'Local service reveals token after hitting three TCP ports in order.', objective: 'Trigger service and retrieve token.',
    challengeData: 'Host: 127.0.0.1, read clue in /bandit/l7/README', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{port_knock_7}', hints: ['Use nc', 'Ports must be hit in sequence'],
    walkthrough: 'nc to ordered ports then query final endpoint', prerequisites: [6], maxSessionMinutes: 25
  },
  {
    level: 8, type: 'bandit', name: 'SSH Key Pivot', category: 'Authentication', difficulty: 3, points: 120,
    description: 'Private key grants access to service account for token.', objective: 'Use provided key to auth locally.',
    challengeData: 'Key in /bandit/l8/id_rsa', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{ssh_key_pivot_8}', hints: ['chmod 600 key', 'ssh -i key user@localhost -p 2222'],
    walkthrough: 'ssh with key and read /home/l8/token', prerequisites: [7], maxSessionMinutes: 25
  },
  {
    level: 9, type: 'bandit', name: 'SUID Misstep', category: 'PrivEsc', difficulty: 3, points: 130,
    description: 'A SUID binary can print protected token.', objective: 'Use SUID helper safely.',
    challengeData: 'Inspect /bandit/l9', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{suid_misstep_9}', hints: ['find / -perm -4000 2>/dev/null', 'Run helper with expected argument'],
    walkthrough: 'Use vulnerable helper to read root-only token', prerequisites: [8], maxSessionMinutes: 30
  },
  {
    level: 10, type: 'bandit', name: 'Symlink Trap', category: 'Linux', difficulty: 3, points: 140,
    description: 'Token file rotates, symlink points to current one.', objective: 'Resolve symlink race-safe.',
    challengeData: 'Investigate /bandit/l10/current', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{symlink_trap_10}', hints: ['readlink -f', 'Use cat on resolved path'],
    walkthrough: 'Resolve and read token file', prerequisites: [9], maxSessionMinutes: 20
  },
  {
    level: 11, type: 'bandit', name: 'Web Fuzz Basic', category: 'Web', difficulty: 3, points: 150,
    description: 'Local web app hides token in unlinked route.', objective: 'Discover endpoint and capture token.',
    challengeData: 'Service at http://127.0.0.1:8081', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{web_fuzz_11}', hints: ['Check robots.txt', 'Use ffuf or dirb style probing'],
    walkthrough: 'Discover /internal/flag route', prerequisites: [10], maxSessionMinutes: 30
  },
  {
    level: 12, type: 'bandit', name: 'SQL Breadcrumb', category: 'Web', difficulty: 3, points: 160,
    description: 'SQLite database has obfuscated token fragments.', objective: 'Reassemble token from db rows.',
    challengeData: 'Database: /bandit/l12/app.db', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{sql_breadcrumb_12}', hints: ['sqlite3 app.db', 'select from fragments order by idx'],
    walkthrough: 'Query and concatenate rows', prerequisites: [11], maxSessionMinutes: 30
  },
  {
    level: 13, type: 'bandit', name: 'PCAP Snoop', category: 'Network', difficulty: 4, points: 170,
    description: 'Captured traffic includes credentials and token exchange.', objective: 'Parse pcap to recover token.',
    challengeData: 'Capture: /bandit/l13/traffic.pcap', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{pcap_snoop_13}', hints: ['Use tshark or tcpdump -r', 'Filter for HTTP auth header'],
    walkthrough: 'Extract token from plaintext payload', prerequisites: [12], maxSessionMinutes: 30
  },
  {
    level: 14, type: 'bandit', name: 'Git Forensics', category: 'Forensics', difficulty: 4, points: 180,
    description: 'Token removed from latest commit but present in history.', objective: 'Recover from git history.',
    challengeData: 'Repo in /bandit/l14/repo', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{git_forensics_14}', hints: ['git log --all', 'git show <sha>'],
    walkthrough: 'Find deleted secret in prior commit', prerequisites: [13], maxSessionMinutes: 30
  },
  {
    level: 15, type: 'bandit', name: 'JWT Tamper', category: 'Web', difficulty: 4, points: 190,
    description: 'Weakly signed JWT grants admin route with token.', objective: 'Craft valid elevated JWT.',
    challengeData: 'Service at http://127.0.0.1:8082', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{jwt_tamper_15}', hints: ['Inspect alg and claims', 'Try known weak secret'],
    walkthrough: 'Forge admin token and call protected endpoint', prerequisites: [14], maxSessionMinutes: 35
  },
  {
    level: 16, type: 'bandit', name: 'Path Traversal', category: 'Web', difficulty: 4, points: 200,
    description: 'File endpoint can be traversed to read token.', objective: 'Exploit traversal and read token file.',
    challengeData: 'Service at http://127.0.0.1:8083', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{path_traversal_16}', hints: ['Try ../ payloads', 'URL encode traversal segments'],
    walkthrough: 'Access restricted token through traversal', prerequisites: [15], maxSessionMinutes: 35
  },
  {
    level: 17, type: 'bandit', name: 'Process Memory', category: 'Forensics', difficulty: 5, points: 220,
    description: 'Running process keeps token in memory.', objective: 'Extract token from process memory safely.',
    challengeData: 'Target PID listed in /bandit/l17/pid.txt', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{process_memory_17}', hints: ['Check /proc/<pid> maps', 'Use strings on /proc/<pid>/mem with care'],
    walkthrough: 'Dump process memory and grep token', prerequisites: [16], maxSessionMinutes: 35
  },
  {
    level: 18, type: 'bandit', name: 'Restricted Shell', category: 'PrivEsc', difficulty: 5, points: 240,
    description: 'User lands in restricted shell and must escape to bash.', objective: 'Escape restricted shell and retrieve token.',
    challengeData: 'Login command in /bandit/l18/README', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{restricted_shell_18}', hints: ['Check allowed commands', 'Use editors/pagers for shell escape'],
    walkthrough: 'Escape rbash then read token', prerequisites: [17], maxSessionMinutes: 35
  },
  {
    level: 19, type: 'bandit', name: 'Container Breakout Myth', category: 'Defense', difficulty: 5, points: 260,
    description: 'Decoy breakout hints; real goal is least-priv path to token.', objective: 'Ignore decoys and use intended path.',
    challengeData: 'Files in /bandit/l19 include many fake leads.', entryCommand: 'bash', validationMode: 'flag',
    expectedFlag: 'bandit{myth_busted_19}', hints: ['Read all notes carefully', 'Find sudoers entry for your user'],
    walkthrough: 'Use permitted sudo command to read token', prerequisites: [18], maxSessionMinutes: 35
  },
  {
    level: 20, type: 'bandit', name: 'Operator Finale', category: 'Final', difficulty: 5, points: 300,
    description: 'Chain all previous skills to complete final objective.', objective: 'Recover final operator token.',
    challengeData: 'Starts in /bandit/l20 with network + file + process clues.', entryCommand: 'bash',
    validationMode: 'flag', expectedFlag: 'bandit{operator_finale_20}',
    hints: ['Start by mapping artifacts', 'One clue from each subdirectory is needed', 'Build a one-liner pipeline'],
    walkthrough: 'Combine pcap clue + key + endpoint + file read', prerequisites: [19], maxSessionMinutes: 40
  }
];

const seedDB = async () => {
  try {
    await Level.deleteMany({});
    await Level.insertMany(levels);
    console.log('20 Bandit-style CTF levels seeded.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
