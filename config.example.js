module.exports = {
  username: "", // not email. The one which you enter when logging into swayam
  password: "", // Your swayam password
  courses: [
    {
      name: "Google Cloud Computing Foundations",
      startWeekIndex: 0, // (optional) indexing starts from 0 from begining. It is different from week index. Week 0 doesn't mean index 0.
      endWeekIndex: 1, // (optional) inclusive
      indexes: [0, 1] // (optional) *** Use either "startWeekIndex, endWeekIndex" (or) "indexes" array. If array is provided, start and end are ignored ***
    }
  ]
};
