from django.core.management.base import BaseCommand
from skills.models import SkillCategory, SkillTest

class Command(BaseCommand):
    help = 'Seed database with standard skill assessments'

    def handle(self, *args, **options):
        self.stdout.write('Clearing old skills...')
        SkillTest.objects.all().delete()
        SkillCategory.objects.all().delete()

        # 1. Python
        python_cat = SkillCategory.objects.create(
            name="Python", icon="file-json", description="Assess Python programming skills."
        )
        SkillTest.objects.create(
            title="Python Fundamentals", category=python_cat,
            difficulty="medium", duration_minutes=30, instructions="Complete basic Python coding challenges.", test_type="coding", 
            problem_statement="Write a Python function `reverse_string(s)` that takes a string `s` and returns the reversed string.\n\nExample:\nInput: \"hello\"\nOutput: \"olleh\"",
            test_cases=[{"input": "hello", "expected_output": "olleh"}, {"input": "SkillProof", "expected_output": "foorPllikS"}]
        )

        # 2. C/C++
        c_cat = SkillCategory.objects.create(
            name="C/C++ Programming", icon="terminal", description="Assess C/C++ programming skills."
        )
        SkillTest.objects.create(
            title="C/C++ Core Concepts", category=c_cat,
            difficulty="medium", duration_minutes=30, instructions="Solve C/C++ memory and logic problems.", test_type="coding", 
            problem_statement="Write a C++ function `int findMax(int arr[], int n)` that returns the maximum element in the given array.",
            test_cases=[{"input": "[1, 5, 3, 9, 2]", "expected_output": "9"}]
        )

        # 3. Java
        java_cat = SkillCategory.objects.create(
            name="Java", icon="coffee", description="Assess Java programming skills."
        )
        SkillTest.objects.create(
            title="Java Assessment", category=java_cat,
            difficulty="medium", duration_minutes=45, instructions="Solve Java OOP challenges.", test_type="coding", 
            problem_statement="Write a Java method `public static boolean isPalindrome(String str)` that checks if a string is a palindrome.",
            test_cases=[{"input": "racecar", "expected_output": "true"}, {"input": "hello", "expected_output": "false"}]
        )

        # 4. HTML & CSS
        html_cat = SkillCategory.objects.create(
            name="HTML & CSS", icon="file-code", description="Assess HTML/CSS frontend skills."
        )
        SkillTest.objects.create(
            title="HTML & CSS Assessment", category=html_cat,
            difficulty="easy", duration_minutes=30, instructions="Build layouts with HTML/CSS.", test_type="coding", 
            problem_statement="Create a simple HTML button with the text 'Click Me' and give it a CSS class 'primary-btn' with a blue background."
        )

        # 5. React.js
        react_cat = SkillCategory.objects.create(
            name="React.js", icon="code", description="Assess React.js frontend skills."
        )
        SkillTest.objects.create(
            title="React Fundamentals", category=react_cat,
            difficulty="medium", duration_minutes=45, instructions="Build a simple React component.", test_type="coding", 
            problem_statement="Create a React functional component `Counter` that displays a number (starting at 0) and has a button to increment it."
        )

        # 6. SQL
        sql_cat = SkillCategory.objects.create(
            name="SQL & Databases", icon="database", description="Assess SQL querying skills."
        )
        SkillTest.objects.create(
            title="SQL Queries Assessment", category=sql_cat,
            difficulty="medium", duration_minutes=30, instructions="Write SQL queries.", test_type="coding", 
            problem_statement="Write an SQL query to find all users in the 'employees' table whose salary is greater than 50000."
        )

        # 7. JavaScript
        js_cat = SkillCategory.objects.create(
            name="JavaScript", icon="code", description="Assess core JavaScript skills."
        )
        SkillTest.objects.create(
            title="JavaScript Algorithms", category=js_cat,
            difficulty="medium", duration_minutes=30, instructions="Solve JS algorithms.", test_type="coding", 
            problem_statement="Write a JavaScript function `fibonacci(n)` that returns the nth number in the Fibonacci sequence. Assume fibonacci(0) = 0 and fibonacci(1) = 1.",
            test_cases=[{"input": "5", "expected_output": "5"}, {"input": "7", "expected_output": "13"}]
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with clean generic skills!'))
