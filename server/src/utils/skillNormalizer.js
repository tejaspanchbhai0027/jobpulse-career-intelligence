/**
 * Normalizes skill strings to help with matching
 */
const skillDictionary = {
  'js': 'javascript',
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'ts': 'typescript',
  'vuejs': 'vue',
  'vue.js': 'vue',
  'angularjs': 'angular',
  'html5': 'html',
  'css3': 'css',
  'python3': 'python',
  'c++': 'cpp',
  'c#': 'csharp',
  'golang': 'go',
  'k8s': 'kubernetes',
  'aws': 'amazon web services',
  'gcp': 'google cloud',
  'postgres': 'postgresql',
  'mongo': 'mongodb'
};

exports.normalizeSkill = (skill) => {
  if (!skill) return '';
  const lower = skill.toLowerCase().trim();
  return skillDictionary[lower] || lower;
};

exports.normalizeSkills = (skillsArray) => {
  if (!Array.isArray(skillsArray)) return [];
  return [...new Set(skillsArray.map(this.normalizeSkill).filter(Boolean))];
};
