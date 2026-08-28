export const renderSwaggerHTML = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CampusBridge API Interactive Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0f19; font-family: sans-serif; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis]
      });
    };
  </script>
</body>
</html>
`;

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'CampusBridge Backend REST API Engine',
    version: '1.0.0',
    description: 'Official Interactive REST API Reference for CampusBridge University Alumni Network Engagement and Career Mentorship Management Platform'
  },
  servers: [
    { url: 'http://localhost:5001/api/v1', description: 'Primary Development API Server' },
    { url: 'http://localhost:5000/api/v1', description: 'Fallback API Server' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    { BearerAuth: [] }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User Login & JWT Generation',
        description: 'Authenticates a Student, Alumni Mentor, or Admin user with email and password.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@university.edu' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully returning user profile and JWT token' },
          401: { description: 'Invalid email or password credentials' }
        }
      }
    },
    '/auth/register/student': {
      post: {
        tags: ['Authentication'],
        summary: 'Register Student Account',
        description: 'Creates a new student account with Student ID card upload.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'regNumber'],
                properties: {
                  name: { type: 'string', example: 'Alex Rivera' },
                  email: { type: 'string', example: 'alex.rivera@student.edu' },
                  password: { type: 'string', example: 'password123' },
                  regNumber: { type: 'string', example: 'REG2024-8921' },
                  academicYear: { type: 'string', example: '3rd Year' },
                  department: { type: 'string', example: 'Computer Science & Engineering' },
                  careerGoals: { type: 'string', example: 'Aspiring Full Stack Engineer' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Student registered successfully' },
          400: { description: 'Account with email already exists' }
        }
      }
    },
    '/auth/register/alumni': {
      post: {
        tags: ['Authentication'],
        summary: 'Register Alumni Mentor Account',
        description: 'Creates a new alumni mentor volunteer profile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password', 'company', 'designation'],
                properties: {
                  name: { type: 'string', example: 'David Vance' },
                  email: { type: 'string', example: 'david.vance@techcorp.com' },
                  password: { type: 'string', example: 'password123' },
                  company: { type: 'string', example: 'Google / TechCorp' },
                  designation: { type: 'string', example: 'Senior Software Engineer' },
                  experienceYears: { type: 'number', example: 7 },
                  maxCapacity: { type: 'number', example: 5 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Alumni mentor registered successfully' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/verification/pending': {
      get: {
        tags: ['Verification Operations'],
        summary: 'Get Pending User Registrations',
        description: 'Fetches unverified Student and Alumni profiles for administrative ID review.',
        responses: {
          200: { description: 'Array of pending user registration objects' },
          403: { description: 'Admin access required' }
        }
      }
    },
    '/verification/users/{userId}/status': {
      patch: {
        tags: ['Verification Operations'],
        summary: 'Update User Verification Status',
        description: 'Approves, Rejects, or Suspends user account credentials.',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', example: 'VERIFIED' },
                  reason: { type: 'string', example: 'ID credentials validated' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Verification status updated successfully' }
        }
      }
    },
    '/domains': {
      get: {
        tags: ['Technical Domains'],
        summary: 'Get Technical Domains & Metrics',
        description: 'Returns technical career domains with interested students, available mentors, and milestone completion rate.',
        responses: {
          200: { description: 'List of career domains with stats' }
        }
      },
      post: {
        tags: ['Technical Domains'],
        summary: 'Create New Domain (Admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'category'],
                properties: {
                  name: { type: 'string', example: 'Embedded Systems' },
                  category: { type: 'string', example: 'Core Engineering' },
                  description: { type: 'string', example: 'Firmware & Edge AI' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Domain created successfully' }
        }
      }
    },
    '/recommendation': {
      get: {
        tags: ['Intelligent Recommendation'],
        summary: 'Get Recommended Alumni Mentors',
        description: 'Generates match score percentage for verified students based on shared domain interests and mentor capacity.',
        responses: {
          200: { description: 'Ranked list of recommended alumni mentors' },
          403: { description: 'Student account verification required' }
        }
      }
    },
    '/mentorship/requests': {
      post: {
        tags: ['Mentorship Management'],
        summary: 'Submit Mentorship Request / Join Waitlist',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorId'],
                properties: {
                  mentorId: { type: 'string', example: 'u-alumni-1' },
                  domainId: { type: 'string', example: 'd-1' },
                  message: { type: 'string', example: 'Requesting career guidance' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Request or waitlist entry created successfully' }
        }
      }
    },
    '/mentorship/requests/{requestId}/respond': {
      patch: {
        tags: ['Mentorship Management'],
        summary: 'Accept or Decline Mentorship Request',
        parameters: [
          { name: 'requestId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['action'],
                properties: {
                  action: { type: 'string', example: 'ACCEPT' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Request accepted or rejected' }
        }
      }
    },
    '/mentorship/active/{mentorshipId}/complete': {
      patch: {
        tags: ['Mentorship Management'],
        summary: 'Complete Mentorship & Release Slot',
        parameters: [
          { name: 'mentorshipId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Mentorship marked COMPLETED and capacity slot released' }
        }
      }
    },
    '/sessions': {
      post: {
        tags: ['1-on-1 Sessions'],
        summary: 'Schedule 1-on-1 Mentorship Session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mentorshipId', 'topic'],
                properties: {
                  mentorshipId: { type: 'string', example: 'am-1' },
                  topic: { type: 'string', example: 'System Design Mock Interview' },
                  scheduledAt: { type: 'string', example: '2026-08-10T14:00:00Z' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Session scheduled successfully with Google Meet link' }
        }
      }
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics & Operations'],
        summary: 'Get Mentorship Operations Center Metrics',
        responses: {
          200: { description: 'KPI analytics summary' },
          403: { description: 'Admin access required' }
        }
      }
    },
    '/audit': {
      get: {
        tags: ['Audit Logs'],
        summary: 'Get Administrative Security Audit Trail',
        responses: {
          200: { description: 'Audit log entries array' }
        }
      }
    }
  }
};
