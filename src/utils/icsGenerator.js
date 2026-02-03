/**
 * ICS Calendar Generator
 * Creates RFC 5545 compliant .ics files for calendar import
 */

/**
 * Generate ICS file content for a 30-day plan
 * @param {Object} planData - The plan object
 * @returns {string} ICS file content
 */
export function generateICS(planData) {
    const now = new Date();
    const startDate = planData.start_date ? new Date(planData.start_date) : now;

    // Format date for ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Create VCALENDAR header
    let ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ExtensioVitae//Longevity Protocol//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:ExtensioVitae Protocol',
        'X-WR-TIMEZONE:UTC',
    ].join('\r\n');

    // Create Morning Protocol Event (7 AM daily for 30 days)
    const morningStart = new Date(startDate);
    morningStart.setHours(7, 0, 0, 0);

    const morningTasks = planData.days?.[0]?.tasks
        ?.filter(t => t.when === 'morning' || t.when === 'now')
        .map(t => `• ${t.task}`)
        .join('\\n') || 'Morning routine tasks';

    ics += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:morning-protocol-${Date.now()}@extensiovitae.com`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(morningStart)}`,
        'DURATION:PT30M',
        'RRULE:FREQ=DAILY;COUNT=30',
        'SUMMARY:Morning Protocol - ExtensioVitae',
        `DESCRIPTION:${morningTasks}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
    ].join('\r\n');

    // Create Evening Protocol Event (9 PM daily for 30 days)
    const eveningStart = new Date(startDate);
    eveningStart.setHours(21, 0, 0, 0);

    const eveningTasks = planData.days?.[0]?.tasks
        ?.filter(t => t.when === 'evening')
        .map(t => `• ${t.task}`)
        .join('\\n') || 'Evening routine tasks';

    ics += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:evening-protocol-${Date.now() + 1}@extensiovitae.com`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(eveningStart)}`,
        'DURATION:PT30M',
        'RRULE:FREQ=DAILY;COUNT=30',
        'SUMMARY:Evening Protocol - ExtensioVitae',
        `DESCRIPTION:${eveningTasks}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
    ].join('\r\n');

    // Close VCALENDAR
    ics += '\r\nEND:VCALENDAR';

    return ics;
}

/**
 * Download ICS file
 * @param {string} icsContent - ICS file content
 * @param {string} filename - Filename for download
 */
export function downloadICS(icsContent, filename = 'ExtensioProtocol.ics') {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
