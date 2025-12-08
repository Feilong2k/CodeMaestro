const { generateMermaid } = require('./frontend/src/utils/mermaidGenerator.js');

const bugTriageWorkflow = {
  initial: "New",
  states: {
    "New": {
      on: {
        "REPORT_RECEIVED": "Triage"
      }
    },
    "Triage": {
      on: {
        "PRIORITY_SET": "Assignment",
        "INVALID_REPORT": "Closed"
      }
    },
    "Assignment": {
      on: {
        "AGENT_ASSIGNED": "In_Progress"
      }
    },
    "In_Progress": {
      on: {
        "FIX_IMPLEMENTED": "Review",
        "BLOCKER_FOUND": "Escalated"
      }
    },
    "Review": {
      on: {
        "FIX_APPROVED": "Merged",
        "FIX_REJECTED": "In_Progress"
      }
    },
    "Merged": {
      on: {
        "DEPLOYED": "Verified"
      }
    },
    "Verified": {
      type: "final"
    },
    "Escalated": {
      on: {
        "STRATEGIC_INTERVENTION": "In_Progress",
        "WONT_FIX": "Closed"
      }
    },
    "Closed": {
      type: "final"
    }
  },
  transitions: [] // Assuming processed from states for this test
};

const mermaidCode = generateMermaid(bugTriageWorkflow);
console.log(mermaidCode);
