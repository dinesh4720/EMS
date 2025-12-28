const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const WHISPER_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
import api from './api';
import toast from 'react-hot-toast';

// Define available functions for the AI
const availableFunctions = {
    create_student: async (args) => {
        try {
            const response = await api.post('/students', {
                name: args.name,
                classId: args.classId,
                rollNo: args.rollNo,
                gender: args.gender,
                dateOfBirth: args.dateOfBirth,
                parentName: args.parentName,
                parentPhone: args.parentPhone,
                academicYear: args.academicYear || '2024-25'
            });
            return { success: true, student: response.data, message: `Student ${args.name} created successfully!` };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    send_form: async (args) => {
        try {
            const response = await api.post('/intake-forms/assignments', {
                formId: args.formId,
                assignedTo: args.recipientId,
                assignedToType: args.recipientType, // 'staff' or 'student'
                dueDate: args.dueDate,
                notes: args.notes
            });
            return { success: true, assignment: response.data, message: `Form sent successfully to ${args.recipientType}!` };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || error.message };
        }
    },

    get_classes: async () => {
        try {
            const response = await api.get('/classes');
            return { success: true, classes: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    get_forms: async () => {
        try {
            const response = await api.get('/intake-forms');
            return { success: true, forms: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    get_staff: async (args) => {
        try {
            const response = await api.get('/staff');
            let staff = response.data;

            // Client-side filtering if API doesn't support it directly
            if (args.name) {
                const search = args.name.toLowerCase();
                staff = staff.filter(s => s.name.toLowerCase().includes(search));
            }
            if (args.role) {
                const search = args.role.toLowerCase();
                staff = staff.filter(s => s.role?.toLowerCase().includes(search));
            }

            return { success: true, staff };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    get_students: async (args) => {
        try {
            const response = await api.get('/students', {
                params: args.classId ? { classId: args.classId } : {}
            });
            let students = response.data;

            // Client-side filtering for robust search
            if (args.name) {
                const search = args.name.toLowerCase();
                students = students.filter(s =>
                    s.name.toLowerCase().includes(search) ||
                    s.parentName?.toLowerCase().includes(search)
                );
            }

            return { success: true, students };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    get_student_details: async (args) => {
        try {
            // If the standard /students endpoint returns full list, we can filter by ID from there
            // OR if there's a specific /students/:id endpoint, we use that.
            // Using list+find is safer if we aren't sure of backend routes.
            // But let's try the direct route first if ID is present.
            // Actually, based on StudentList, it seems to just iterate the main list.
            // Let's assume fetching all and finding by ID is safest without seeing api.js

            // Wait, StudentList uses `students` context.
            // The API likely supports GET /students/:id
            try {
                const response = await api.get(`/students/${args.id}`);
                return { success: true, student: response.data };
            } catch (err) {
                // Fallback: fetch all and find
                const response = await api.get('/students');
                const student = response.data.find(s => s.id === args.id || s._id === args.id);
                if (student) return { success: true, student };
                throw new Error("Student not found");
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// Function definitions for Groq
const functionDefinitions = [
    {
        name: "create_student",
        description: "Create a new student in the school system with mandatory details",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Full name of the student" },
                classId: { type: "string", description: "The MongoDB ObjectId of the class" },
                rollNo: { type: "number", description: "Roll number" },
                gender: { type: "string", enum: ["Male", "Female", "Other"] },
                dateOfBirth: { type: "string", description: "YYYY-MM-DD" },
                parentName: { type: "string" },
                parentPhone: { type: "string" },
                academicYear: { type: "string" }
            },
            required: ["name", "classId", "gender", "parentName", "parentPhone"]
        }
    },
    {
        name: "send_form",
        description: "Send an intake form to a staff member or student",
        parameters: {
            type: "object",
            properties: {
                formId: { type: "string" },
                recipientId: { type: "string" },
                recipientType: { type: "string", enum: ["staff", "student"] },
                dueDate: { type: "string" },
                notes: { type: "string" }
            },
            required: ["formId", "recipientId", "recipientType"]
        }
    },
    {
        name: "get_classes",
        description: "Get list of all classes in the school",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "get_forms",
        description: "Get list of all available intake forms",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "get_staff",
        description: "Get list of staff memebrs, optionally filtered by name or role",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Filter by staff name" },
                role: { type: "string", description: "Filter by role (e.g. Teacher, Admin)" }
            }
        }
    },
    {
        name: "get_students",
        description: "Search for students by name, parent name, or class",
        parameters: {
            type: "object",
            properties: {
                classId: { type: "string", description: "Filter by class ID" },
                name: { type: "string", description: "Search query for student name or parent name" }
            }
        }
    },
    {
        name: "get_student_details",
        description: "Get detailed information for a specific student by ID",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The student ID" }
            },
            required: ["id"]
        }
    }
];

export const aiService = {
    async transcribeAudio(audioBlob) {
        if (!API_KEY) {
            console.error('Groq API Key is missing');
            throw new Error('API Key is missing');
        }

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.webm');
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('language', 'en');
            formData.append('response_format', 'json');

            const response = await fetch(WHISPER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Failed to transcribe audio');
            }

            const data = await response.json();
            return data.text || '';
        } catch (error) {
            console.error('Whisper Transcription Error:', error);
            throw error;
        }
    },

    async sendMessage(messages, onFunctionCall) {
        if (!API_KEY) {
            console.error('Groq API Key is missing');
            throw new Error('API Key is missing');
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are a helpful AI assistant for a school management dashboard. You can access the database to answer user queries.
                            
Capabilities:
- **Search Database**: Use get_students, get_staff, get_classes to find people or info.
- **Specific Details**: Use get_student_details(id) if you need deep info like grades, attendance, or parents for a specific person.
- **Create/Manage**: You can create students and send forms.

Guidelines:
- If a user asks "Who is [Name]?", use get_students({ name: [Name] }) or get_staff({ name: [Name] }).
- If a user asks for "details of [Name]", first search for them, then if needed, fetch details using their ID.
- Be concise. Don't show JSON directly; summarize the info in a friendly way.`
                        },
                        ...messages
                    ],
                    tools: functionDefinitions.map(func => ({
                        type: "function",
                        function: func
                    })),
                    tool_choice: "auto",
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Failed to fetch response from Groq');
            }

            const data = await response.json();
            const message = data.choices[0]?.message;

            // Check if AI wants to call a function
            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                // Notify UI that function is being called
                if (onFunctionCall) {
                    onFunctionCall(functionName, functionArgs);
                }

                // Execute the function
                const functionToCall = availableFunctions[functionName];
                const functionResult = await functionToCall(functionArgs);

                // Send function result back to AI
                const followUpMessages = [
                    ...messages,
                    message,
                    {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: functionName,
                        content: JSON.stringify(functionResult)
                    }
                ];

                // Get AI's response after function execution
                const followUpResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful AI assistant for a school management dashboard. Summarize the database results for the user."
                            },
                            ...followUpMessages
                        ],
                        temperature: 0.7,
                        max_tokens: 1024
                    })
                });

                const followUpData = await followUpResponse.json();
                return {
                    content: followUpData.choices[0]?.message?.content || "Action completed.",
                    functionCalled: functionName,
                    functionResult
                };
            }

            return {
                content: message.content || "I couldn't generate a response.",
                functionCalled: null
            };
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    },

    getPrebuiltPrompts() {
        return [
            {
                id: 'create_student',
                label: 'Create Student',
                icon: '👨‍🎓',
                prompt: 'Create a new student named [Name] in class [Class]'
            },
            {
                id: 'send_form',
                label: 'Send Form',
                icon: '📝',
                prompt: 'Send the [Form Name] form to [Staff/Student Name]'
            },
            {
                id: 'school_notice',
                label: 'Draft School Notice',
                icon: '📢',
                prompt: 'Draft a formal school notice regarding: '
            },
            {
                id: 'fee_reminder',
                label: 'Fee Payment Reminder',
                icon: '💰',
                prompt: 'Draft a polite but firm WhatsApp message to parents reminding them about the pending Term 2 fees due next week.'
            },
            {
                id: 'staff_appreciation',
                label: 'Staff Appreciation Email',
                icon: '👏',
                prompt: 'Write an appreciation email for a teacher who successfully organized the Annual Sports Day.'
            },
            {
                id: 'lesson_plan',
                label: 'Create Lesson Plan',
                icon: '📚',
                prompt: 'Create a 45-minute lesson plan for Grade [X] on the topic of: '
            }
        ];
    }
};
