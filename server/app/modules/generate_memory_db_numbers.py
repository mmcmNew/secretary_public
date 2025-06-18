import random


def generate_random_numbers(num=35, start=1, end=5):
    """
    Формирует список строк, каждая из которых содержит три случайных числа в формате число1.число2.число3.
    Возвращает строку, содержащую такие группы, разделенные пробелами.
    """
    random_groups = [
        f"{random.randint(start, end)}.{random.randint(start, end)}.{random.randint(start, end)}"
        for _ in range(num)
    ]
    return ' '.join(random_groups)


def main():
    try:
        num = input("Введите количество наборов чисел (по умолчанию 35): ")
        num = int(num) if num else 35

        start = input("Введите начало диапазона чисел (по умолчанию 1): ")
        start = int(start) if start else 1

        end = input("Введите конец диапазона чисел (по умолчанию 5): ")
        end = int(end) if end else 5

        if start > end:
            raise ValueError("Начало диапазона не может быть больше конца диапазона.")

    except ValueError as e:
        print(f"Ошибка ввода: {e}")
        return

    result = generate_random_numbers(num, start, end)
    print("Сгенерированные числа:", result)

if __name__ == "__main__":
    main()

