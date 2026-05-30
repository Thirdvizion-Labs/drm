from app import app, db
from models import User, Course, Module, Lesson, Enrollment
from datetime import datetime

def seed_mental_health_courses():
    with app.app_context():
        instructor = User.query.filter_by(email='sarah.therapist@mindwell.com').first()
        if not instructor:
            print("Instructor not found. Run app.py first to create users.")
            return
        
        if Course.query.first():
            print("Courses already exist. Skipping seed.")
            return
        
        courses_data = [
            {
                "title": "Stress Management 101",
                "description": "Learn effective techniques to manage and reduce stress in your daily life. This comprehensive course covers understanding stress triggers, practical coping strategies, and building resilience.",
                "modules": [
                    {
                        "title": "Understanding Stress",
                        "description": "Learn what stress is and how it affects your body and mind",
                        "lessons": [
                            {
                                "title": "What is Stress?",
                                "content_text": "Stress is your body's natural response to demands or threats. When you perceive a situation as challenging or threatening, your body releases stress hormones that trigger the 'fight or flight' response. Understanding this mechanism is the first step to managing it effectively.",
                                "duration_minutes": 15
                            },
                            {
                                "title": "Recognizing Stress Symptoms",
                                "content_text": "Stress can manifest in many ways: physical symptoms like headaches and muscle tension, emotional symptoms like anxiety and irritability, and behavioral changes like sleep disturbances and appetite changes. Learning to recognize these signs early helps you take action before stress becomes overwhelming.",
                                "duration_minutes": 20
                            }
                        ]
                    },
                    {
                        "title": "Practical Stress Relief Techniques",
                        "description": "Hands-on techniques you can use immediately",
                        "lessons": [
                            {
                                "title": "Deep Breathing Exercises",
                                "content_text": "Deep breathing activates your parasympathetic nervous system, which calms your body's stress response. Practice the 4-7-8 technique: inhale for 4 counts, hold for 7 counts, exhale for 8 counts. Repeat 3-4 times whenever you feel stressed.",
                                "duration_minutes": 12
                            },
                            {
                                "title": "Progressive Muscle Relaxation",
                                "content_text": "This technique involves tensing and then relaxing different muscle groups in sequence. Start with your toes and work up to your head. Hold each tension for 5 seconds, then relax for 30 seconds. This helps release physical tension you may not realize you're holding.",
                                "duration_minutes": 18
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Mindfulness Fundamentals",
                "description": "Discover the power of living in the present moment. This course introduces mindfulness meditation, practical exercises for daily life, and techniques to cultivate inner peace.",
                "modules": [
                    {
                        "title": "Introduction to Mindfulness",
                        "description": "Foundational concepts of mindfulness practice",
                        "lessons": [
                            {
                                "title": "What is Mindfulness?",
                                "content_text": "Mindfulness is the practice of being fully present and engaged in the current moment, aware of your thoughts and feelings without judgment. It's about observing your experience with curiosity rather than reactivity.",
                                "duration_minutes": 14
                            },
                            {
                                "title": "The Science Behind Mindfulness",
                                "content_text": "Research shows that regular mindfulness practice can actually change brain structure, increasing gray matter in areas associated with emotional regulation, self-awareness, and compassion while decreasing activity in the amygdala (the fear center).",
                                "duration_minutes": 22
                            }
                        ]
                    },
                    {
                        "title": "Basic Mindfulness Practices",
                        "description": "Simple practices to begin your mindfulness journey",
                        "lessons": [
                            {
                                "title": "Mindful Breathing",
                                "content_text": "Focus on your breath as an anchor to the present moment. Notice the sensation of breathing - the rise and fall of your chest, air moving through your nostrils. When your mind wanders, gently bring attention back to your breath without judgment.",
                                "duration_minutes": 16
                            },
                            {
                                "title": "Body Scan Meditation",
                                "content_text": "Systematically move your attention through different parts of your body, noticing sensations without trying to change them. Start at the top of your head and slowly move down to your toes. This practice increases body awareness and helps release tension.",
                                "duration_minutes": 20
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Anxiety Coping Strategies",
                "description": "Practical tools and techniques for managing anxiety. Learn to understand your anxiety, challenge anxious thoughts, and build a toolkit of coping strategies.",
                "modules": [
                    {
                        "title": "Understanding Anxiety",
                        "description": "Learn about anxiety and its effects",
                        "lessons": [
                            {
                                "title": "What is Anxiety?",
                                "content_text": "Anxiety is more than just feeling stressed. It's a persistent feeling of worry and fear about everyday situations. Unlike stress which fades once a situation resolves, anxiety persists and can interfere with daily life. Understanding this distinction is crucial.",
                                "duration_minutes": 18
                            },
                            {
                                "title": "The Anxiety Loop",
                                "content_text": "Anxiety often creates a feedback loop: anxious thoughts lead to physical symptoms, which increase anxiety, which intensifies thoughts. Breaking this cycle requires understanding each component and developing strategies to interrupt the loop.",
                                "duration_minutes": 15
                            }
                        ]
                    },
                    {
                        "title": "Coping Techniques",
                        "description": "Practical strategies to manage anxiety",
                        "lessons": [
                            {
                                "title": "Cognitive Restructuring",
                                "content_text": "This technique involves identifying anxious thoughts and challenging them. Ask yourself: Is this thought based on facts or feelings? What's the worst that could happen? What's most likely to happen? Would I give this advice to a friend?",
                                "duration_minutes": 25
                            },
                            {
                                "title": "Grounding Techniques",
                                "content_text": "The 5-4-3-2-1 technique: Acknowledge 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings you back to the present moment when anxiety takes hold.",
                                "duration_minutes": 12
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Building Resilience",
                "description": "Develop mental strength and the ability to bounce back from adversity. Learn proven strategies to build emotional resilience and thrive in the face of challenges.",
                "modules": [
                    {
                        "title": "Foundations of Resilience",
                        "description": "Core concepts of building resilience",
                        "lessons": [
                            {
                                "title": "What is Resilience?",
                                "content_text": "Resilience is the ability to adapt and recover from adversity. It's not about avoiding difficult situations but learning to navigate them effectively. Resilient people experience stress just like everyone else, but they have tools to cope and bounce back.",
                                "duration_minutes": 16
                            },
                            {
                                "title": "The Resilience Factors",
                                "content_text": "Key factors that contribute to resilience include: optimism, self-awareness, self-regulation, mental agility, strong connections, and purpose. Each of these can be developed with practice and intention.",
                                "duration_minutes": 20
                            }
                        ]
                    },
                    {
                        "title": "Building Your Resilience Toolkit",
                        "description": "Practical exercises to strengthen resilience",
                        "lessons": [
                            {
                                "title": "Developing Growth Mindset",
                                "content_text": "A growth mindset sees challenges as opportunities to learn rather than threats of failure. Embrace mistakes as feedback, celebrate effort over outcomes, and view setbacks as temporary and manageable.",
                                "duration_minutes": 18
                            },
                            {
                                "title": "Building Strong Support Networks",
                                "content_text": "Social support is crucial for resilience. Invest in relationships, practice being a good listener, seek support when needed, and remember that asking for help is a sign of strength, not weakness.",
                                "duration_minutes": 15
                            }
                        ]
                    }
                ]
            },
            {
                "title": "Sleep and Mental Health",
                "description": "Understand the vital connection between sleep and mental well-being. Learn evidence-based strategies to improve your sleep quality and support your mental health.",
                "modules": [
                    {
                        "title": "The Sleep-Mental Health Connection",
                        "description": "Understanding why sleep matters",
                        "lessons": [
                            {
                                "title": "Why Sleep Matters",
                                "content_text": "Sleep isn't just rest - it's active restoration. During sleep, your brain consolidates memories, processes emotions, and clears toxins. Poor sleep is linked to increased anxiety, depression, and reduced emotional regulation.",
                                "duration_minutes": 17
                            },
                            {
                                "title": "Understanding Sleep Cycles",
                                "content_text": "You cycle through stages of light sleep, deep sleep, and REM sleep throughout the night. Each stage serves different functions. Understanding this helps you appreciate why both duration and quality of sleep matter.",
                                "duration_minutes": 14
                            }
                        ]
                    },
                    {
                        "title": "Improving Your Sleep",
                        "description": "Practical tips for better sleep hygiene",
                        "lessons": [
                            {
                                "title": "Sleep Hygiene Fundamentals",
                                "content_text": "Good sleep hygiene includes: consistent sleep schedule, dark cool bedroom, no screens before bed, limiting caffeine after noon, and regular exercise. Small changes in these areas can significantly improve sleep quality.",
                                "duration_minutes": 20
                            },
                            {
                                "title": "Relaxation for Sleep",
                                "content_text": "Develop a pre-sleep relaxation routine. Try gentle stretching, reading (not on a screen), journaling to offload worries, or listening to calm music. The goal is to signal to your body that it's time to wind down.",
                                "duration_minutes": 16
                            }
                        ]
                    }
                ]
            }
        ]
        
        for course_data in courses_data:
            course = Course(
                title=course_data['title'],
                description=course_data['description'],
                instructor_id=instructor.id,
                is_published=True,
                thumbnail_url=f"https://picsum.photos/seed/{course_data['title'].replace(' ', '')}/400/225"
            )
            db.session.add(course)
            db.session.flush()
            
            for module_idx, module_data in enumerate(course_data['modules']):
                module = Module(
                    course_id=course.id,
                    title=module_data['title'],
                    description=module_data['description'],
                    order_index=module_idx
                )
                db.session.add(module)
                db.session.flush()
                
                for lesson_idx, lesson_data in enumerate(module_data['lessons']):
                    lesson = Lesson(
                        module_id=module.id,
                        title=lesson_data['title'],
                        content_text=lesson_data['content_text'],
                        duration_minutes=lesson_data['duration_minutes'],
                        order_index=lesson_idx,
                        video_path=None
                    )
                    db.session.add(lesson)
        
        db.session.commit()
        print(f"Seeded {len(courses_data)} mental health courses successfully!")

if __name__ == '__main__':
    seed_mental_health_courses()
