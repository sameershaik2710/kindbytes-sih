from celery import shared_task

from . import sim


@shared_task(name="core.tasks.sim_tick")
def sim_tick():
    sim.ensure_seeded()
    return sim.tick()
