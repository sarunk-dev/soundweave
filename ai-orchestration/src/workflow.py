from __future__ import annotations

from langgraph.graph import StateGraph, END

from .agents.parser    import parser_agent
from .agents.planner   import planner_agent
from .agents.generator import generator_agent
from .agents.mixer     import mixer_agent


def _is_failed(state: dict) -> str:
    return "end" if state.get("status") == "failed" else "continue"


def build_generation_workflow() -> StateGraph:
    """
    Build the 4-agent LangGraph workflow:
        parser → planner → generator → mixer → END
    Each agent receives the full state dict and returns an updated state dict.
    """
    graph = StateGraph(dict)

    graph.add_node("parser",    parser_agent)
    graph.add_node("planner",   planner_agent)
    graph.add_node("generator", generator_agent)
    graph.add_node("mixer",     mixer_agent)

    # ── Edges with early-exit on failure ─────────────────────────────────────
    graph.add_conditional_edges(
        "parser",
        _is_failed,
        {"continue": "planner", "end": END},
    )
    graph.add_conditional_edges(
        "planner",
        _is_failed,
        {"continue": "generator", "end": END},
    )
    graph.add_conditional_edges(
        "generator",
        _is_failed,
        {"continue": "mixer", "end": END},
    )
    graph.add_edge("mixer", END)

    graph.set_entry_point("parser")

    return graph.compile()


# Singleton compiled graph
generation_workflow = build_generation_workflow()


def run_generation(scene_id: str, script: str) -> dict:
    """Run the full generation pipeline and return final state."""
    initial_state = {
        "scene_id":        scene_id,
        "script":          script,
        "parsed_script":   None,
        "audio_plan":      None,
        "generated_files": [],
        "final_mix_url":   None,
        "duration":        None,
        "status":          "parsing",
        "errors":          [],
    }
    return generation_workflow.invoke(initial_state)
