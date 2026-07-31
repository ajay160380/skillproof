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
            difficulty="medium", duration_minutes=30, instructions="Complete basic Python coding challenges.", test_type="coding", problem_statement="Solve standard Python programming problems."
        )

        # 2. C/C++
        c_cat = SkillCategory.objects.create(
            name="C/C++ Programming", icon="terminal", description="Assess C/C++ programming skills."
        )
        SkillTest.objects.create(
            title="C/C++ Core Concepts", category=c_cat,
            difficulty="medium", duration_minutes=30, instructions="Solve C/C++ memory and logic problems.", test_type="coding", problem_statement="Implement standard C functions."
        )

        # 3. Java
        java_cat = SkillCategory.objects.create(
            name="Java", icon="coffee", description="Assess Java programming skills."
        )
        SkillTest.objects.create(
            title="Java Assessment", category=java_cat,
            difficulty="medium", duration_minutes=45, instructions="Solve Java OOP challenges.", test_type="coding", problem_statement="Implement Java classes and methods."
        )

        # 4. HTML & CSS
        html_cat = SkillCategory.objects.create(
            name="HTML & CSS", icon="file-code", description="Assess HTML/CSS frontend skills."
        )
        SkillTest.objects.create(
            title="HTML & CSS Assessment", category=html_cat,
            difficulty="easy", duration_minutes=30, instructions="Build layouts with HTML/CSS.", test_type="coding", problem_statement="Create a responsive layout."
        )

        # 5. React.js
        react_cat = SkillCategory.objects.create(
            name="React.js", icon="code", description="Assess React.js frontend skills."
        )
        SkillTest.objects.create(
            title="React Fundamentals", category=react_cat,
            difficulty="medium", duration_minutes=45, instructions="Build a simple React component.", test_type="coding", problem_statement="Implement a React component with state."
        )

        # 6. SQL
        sql_cat = SkillCategory.objects.create(
            name="SQL & Databases", icon="database", description="Assess SQL querying skills."
        )
        SkillTest.objects.create(
            title="SQL Queries Assessment", category=sql_cat,
            difficulty="medium", duration_minutes=30, instructions="Write SQL queries.", test_type="coding", problem_statement="Write SQL queries to retrieve data."
        )

        # 7. JavaScript
        js_cat = SkillCategory.objects.create(
            name="JavaScript", icon="code", description="Assess core JavaScript skills."
        )
        SkillTest.objects.create(
            title="JavaScript Algorithms", category=js_cat,
            difficulty="medium", duration_minutes=30, instructions="Solve JS algorithms.", test_type="coding", problem_statement="Solve JavaScript algorithmic challenges."
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with clean generic skills!'))
