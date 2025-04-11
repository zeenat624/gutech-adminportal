import React from 'react';
import './TimetableGrid.css';

const TimetableGrid = ({
  filteredSchedules,
  sections,
  teachers,
  getSectionColor,
  handleEditSchedule,
  handleDeleteSchedule,
  filters,
  clearFilters
}) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <div className="timetable-grid">
      <div className="filters-summary">
        {Object.values(filters).some(v => v) ? (
          <div className="applied-filters">
            <span>Filtered by: </span>
            {filters.department && <span className="filter-badge">Department: {filters.department}</span>}
            {filters.program && <span className="filter-badge">Program: {filters.program}</span>}
            {filters.semester && <span className="filter-badge">Semester: {filters.semester}</span>}
            {filters.day && <span className="filter-badge">Day: {filters.day}</span>}
            {filters.teacher && (
              <span className="filter-badge">
                Teacher: {teachers.find(t => t._id === filters.teacher)?.userId?.name}
              </span>
            )}
            {filters.section && (
              <span className="filter-badge">
                Section: {sections.find(s => s._id === filters.section)?.section}
              </span>
            )}
            <button className="clear-filters-small" onClick={clearFilters}>×</button>
          </div>
        ) : (
          <div className="all-schedules-notice">
            Showing all schedules
          </div>
        )}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Time</th>
            {days.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time, i) => {
            const nextTime = timeSlots[i + 1];
            if (!nextTime) return null;

            return (
              <tr key={time}>
                <td>{`${time} - ${nextTime}`}</td>
                {days.map(day => {
                  // Find the schedule for this time slot and day
                  const schedule = filteredSchedules.find(s => 
                    s.day === day && 
                    s.timeSlot?.startTime === time &&
                    s.timeSlot?.endTime === nextTime
                  );

                  // Find the corresponding section data
                  const sectionData = sections.find(s => s._id === schedule?.sectionId?._id);

                  return (
                    <td key={day} className={schedule ? 'scheduled' : ''}>
                      {schedule && (
                        <div 
                          className="schedule-cell"
                          style={{ backgroundColor: getSectionColor(schedule) }}
                        >
                          <div className="schedule-info">
                            <p className="course-name">
                              {sectionData?.courseId?.name || schedule.courseId?.name || "Unknown Course"}
                              <span className="section-name"> 
                                (Section {sectionData?.section || schedule.sectionId?.section || '-'})
                              </span>
                            </p>
                            <p className="teacher-name">
                              Teacher: {sectionData?.teacherId?.userId?.name || 'No teacher assigned'}
                            </p>
                            <p className="course-details">
                              {sectionData?.courseId?.department && `${sectionData.courseId.department}`}
                              {sectionData?.courseId?.department && sectionData.courseId?.program && ' | '}
                              {sectionData?.courseId?.program && `${sectionData.courseId.program}`}
                              {(sectionData?.courseId?.department || sectionData.courseId?.program) && sectionData.courseId?.semester && ' | '}
                              {sectionData?.courseId?.semester && `Semester ${sectionData.courseId.semester}`}
                            </p>
                            <p className="room-info">{schedule.timeSlot?.room || 'No Room'}</p>
                          </div>
                          <div className="schedule-actions">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              Edit
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDeleteSchedule(schedule._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimetableGrid; 