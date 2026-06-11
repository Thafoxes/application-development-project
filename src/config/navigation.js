export const navigationConfig = {
  coordinator: [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Manage Sessions', path: '/manage-session', icon: 'sessions' },
    { name: 'View Calendar', path: '/calendar', icon: 'calendar' },
    { name: 'Add Timetable', path: '/add-time-table', icon: 'timetable' },
    { name: 'Manage Users', path: '/manage-user', icon: 'users' },
    { name: 'Manage FYP', path: '#', icon: 'document' },
    { name: 'Bulk Import', path: '/import-users', icon: 'import' }
  ],
  student: [
    { name: 'Dashboard', path: '/student/dashboard', icon: 'dashboard' },
    { name: 'My Schedule', path: '/student/schedule', icon: 'calendar' },
    { name: 'Submit Proposal', path: '/student/proposal', icon: 'document' },
    { name: 'Logbook Entries', path: '/student/logbook', icon: 'logbook' }
  ],
  supervisor: [
    { name: 'Dashboard', path: '/supervisor/dashboard', icon: 'dashboard' },
    { name: 'My Supervisees', path: '/supervisor/students', icon: 'users' },
    { name: 'Weekly Logs', path: '/supervisor/logs', icon: 'logbook' },
    { name: 'Meeting Scheduler', path: '/supervisor/schedule', icon: 'calendar' }
  ],
  examiner: [
    { name: 'Dashboard', path: '/examiner/dashboard', icon: 'dashboard' },
    { name: 'Assigned Projects', path: '/examiner/projects', icon: 'document' },
    { name: 'Evaluation Panel', path: '/examiner/evaluations', icon: 'sessions' },
    { name: 'Presentation Slots', path: '/examiner/slots', icon: 'timetable' }
  ]
}
