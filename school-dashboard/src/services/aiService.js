const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const WHISPER_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
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
            if (args.department) {
                const search = args.department.toLowerCase();
                staff = staff.filter(s => s.department?.toLowerCase().includes(search));
            }

            return { success: true, staff, count: staff.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    get_staff_details: async (args) => {
        try {
            // Try to get specific staff member details
            try {
                const response = await api.get(`/staff/${args.id}`);
                return { success: true, staff: response.data };
            } catch (err) {
                // Fallback: fetch all and find
                const response = await api.get('/staff');
                const staff = response.data.find(s => s.id === args.id || s._id === args.id);
                if (staff) return { success: true, staff };
                throw new Error("Staff member not found");
            }
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
        description: "Search for staff members by name, role, or department. Returns list of staff with their basic information.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "Filter by staff name (partial match)" },
                role: { type: "string", description: "Filter by role (e.g. Teacher, Admin, Principal)" },
                department: { type: "string", description: "Filter by department (e.g. Mathematics, Science)" }
            }
        }
    },
    {
        name: "get_staff_details",
        description: "Get detailed information for a specific staff member by ID including contact info, qualifications, subjects, etc.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "The staff member ID" }
            },
            required: ["id"]
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
        if (!GROQ_API_KEY) {
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
                    'Authorization': `Bearer ${GROQ_API_KEY}`
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

    async sendMessage(messages, onFunctionCall, selectedModel = 'groq') {
        if (selectedModel === 'groq' && !GROQ_API_KEY) {
            console.error('Groq API Key is missing');
            throw new Error('Groq API Key is missing');
        }
        if (selectedModel === 'gemini' && !GEMINI_API_KEY) {
            console.error('Gemini API Key is missing');
            throw new Error('Gemini API Key is missing');
        }

        if (selectedModel === 'gemini') {
            return this.sendMessageGemini(messages, onFunctionCall);
        } else {
            return this.sendMessageGroq(messages, onFunctionCall);
        }
    },

    async sendMessageGroq(messages, onFunctionCall) {

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are a helpful AI assistant for a school management dashboard with READ-ONLY access to the school database.

**CRITICAL RULE: NEVER MAKE UP DATA**
- You can ONLY provide information that comes from database function calls
- If you don't have data, say "Let me check the database" and call the appropriate function
- DO NOT invent names, numbers, or details
- If a function returns no results, say so clearly

**What You Can Do:**
- **Search & View**: Access complete information about students, staff, classes, and forms
- **Answer Questions**: Provide details about any person, class, or school data (ONLY from database)
- **Create Students**: Add new students to the system
- **Send Forms**: Assign intake forms to staff or students
- **Draft Content**: Help write notices, emails, lesson plans (creative writing is OK)

**Database Access (READ-ONLY):**
- get_staff: Search staff by name, role, or department
- get_staff_details: Get full details of a specific staff member
- get_students: Search students by name, parent name, or class
- get_student_details: Get full details of a specific student
- get_classes: View all classes
- get_forms: View all available forms

**Important Rules:**
- You can VIEW all staff and student information but CANNOT edit, update, or delete staff records
- Only students can be created; staff data is read-only
- When users ask about staff/students, ALWAYS call the appropriate function first
- Present information in a friendly, conversational way - don't show raw JSON
- If you need detailed info, first search, then use the _details function with the ID

**Examples:**
- "Who teaches math?" → Call get_staff({ department: "Mathematics" }) then present results
- "Tell me about John Doe" → Call get_staff({ name: "John Doe" }) then present what you find
- "List all teachers" → Call get_staff({ role: "Teacher" }) then list them`
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
                const followUpResponse = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${GROQ_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            {
                                role: "system",
                                content: `You are a helpful AI assistant for a school management dashboard. 

CRITICAL INSTRUCTIONS:
- You just received REAL data from the school database
- Present this data in a clear, friendly, conversational format
- DO NOT make up or hallucinate any information
- DO NOT add details that aren't in the function result
- If the result shows "success: false", explain the error to the user
- If the result is empty or has no data, say so clearly
- Format lists nicely with bullet points or numbered lists
- For staff/student info, present key details like name, role, contact info
- Keep responses concise but informative

Example good responses:
- "I found 3 teachers in the Mathematics department: [list names]"
- "Here's the information for John Doe: [present details]"
- "I couldn't find any staff matching that name. Could you check the spelling?"
- "The database returned 0 results for that query."`
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

    async sendMessageGemini(messages, onFunctionCall) {
        try {
            // Helper to format messages for Gemini
            const formatMessage = (msg) => {
                if (msg.role === 'tool') {
                    // Function response from previous turn
                    return {
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: msg.name,
                                response: { name: msg.name, content: JSON.parse(msg.content) } // Gemini expects an object in response
                            }
                        }]
                    };
                }
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                };
            };

            const contents = messages
                .filter(m => m.role !== 'system')
                .map(formatMessage);

            // System prompt
            const systemPrompt = `You are a helpful AI assistant for a school management dashboard with READ-ONLY access to the school database.
CRITICAL RULE: NEVER MAKE UP DATA. Use get_staff, get_students, etc.
Functions available: get_staff, get_students, get_classes, get_forms, create_student, send_form.
When asked about staff/students, ALWAYS search details using functions.`;

            // Prepend system prompt to the first user message or as a separate turn? 
            // Safest for Gemini via REST is to prepend to first user part or use system_instruction (if supported by model).
            // Let's prepend to the first message if it exists and is user.
            if (contents.length > 0 && contents[0].role === 'user') {
                contents[0].parts[0].text = systemPrompt + "\n\n" + contents[0].parts[0].text;
            } else {
                contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
            }

            // Prepare Tools
            const tools = [{
                function_declarations: functionDefinitions.map(def => ({
                    name: def.name,
                    description: def.description,
                    parameters: def.parameters
                }))
            }];

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    tools,
                    generationConfig: { temperature: 0.7 }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Failed to fetch response from Gemini');
            }

            const data = await response.json();
            const part = data.candidates?.[0]?.content?.parts?.[0];

            if (part?.functionCall) {
                const { name, args } = part.functionCall;

                // Notify UI
                if (onFunctionCall) onFunctionCall(name, args);

                // Execute
                const functionToCall = availableFunctions[name];
                if (!functionToCall) throw new Error(`Function ${name} not found`);

                const functionResult = await functionToCall(args);

                // Send result back
                // We need to send the ENTIRE history + the function call + the function response
                const followUpContents = [
                    ...contents,
                    {
                        role: 'model',
                        parts: [{ functionCall: { name, args } }]
                    },
                    {
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: name,
                                response: { result: functionResult }
                            }
                        }]
                    }
                ];

                const followUpResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: followUpContents,
                        tools,
                        generationConfig: { temperature: 0.7 }
                    })
                });

                const followUpData = await followUpResponse.json();
                const followUpText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text;

                return {
                    content: followUpText || "Action completed.",
                    functionCalled: name,
                    functionResult
                };
            }

            return {
                content: part?.text || "I couldn't generate a response.",
                functionCalled: null
            };

        } catch (error) {
            console.error('Gemini AI Service Error:', error);
            throw error;
        }
    },

    getAvailableModels() {
        return [
            {
                id: 'groq',
                name: 'LLaMA 3.3 70B',
                provider: 'Groq',
                description: 'Fast and powerful with function calling',
                available: !!GROQ_API_KEY
            },
            {
                id: 'gemini',
                name: 'Gemini 2.5 Pro',
                provider: 'Google',
                description: 'Advanced reasoning with thinking mode',
                available: !!GEMINI_API_KEY
            }
        ];
    },

    getPrebuiltPrompts() {
        return [
            {
                id: 'search_staff',
                label: 'Find Staff',
                icon: '👨‍🏫',
                prompt: 'Who are the teachers in the Mathematics department?'
            },
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
                id: 'lesson_plan',
                label: 'Create Lesson Plan',
                icon: '📚',
                prompt: 'Create a 45-minute lesson plan for Grade [X] on the topic of: '
            }
        ];
    }
};
