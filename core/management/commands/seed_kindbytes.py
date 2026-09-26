from django.core.management.base import BaseCommand

from core import sim


class Command(BaseCommand):
    help = "Create the 18-city KindBytes network (cities, receivers, volunteers, bulk generators, live batches)."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Wipe simulated data first (keeps user accounts).")

    def handle(self, *args, reset=False, **kw):
        created = sim.seed(reset=reset)
        self.stdout.write(self.style.SUCCESS("Seeded KindBytes network." if created else "Network already seeded."))
