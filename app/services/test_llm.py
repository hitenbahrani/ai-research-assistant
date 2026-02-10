from app.services.llm import generate_answer

if __name__ == "__main__":
    print("\n--- LLM SANITY TEST ---\n")

    question = "Explain Retrieval-Augmented Generation in simple terms."
    answer = generate_answer(question)

    print("Q:", question)
    print("\nA:\n", answer)

    print("\n--- TEST COMPLETE ---\n")