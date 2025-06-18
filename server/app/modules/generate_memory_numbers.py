import random


def generate_random_numbers(num=35, start=0, end=100):
    """
    Формирует список случайных чисел в заданном диапазоне в количестве num.
    Возвращает строку, содержащую сгенерированные числа, разделенные пробелами.
    """
    random_numbers = [random.randint(start, end) for _ in range(num)]
    return ' '.join(map(str, random_numbers))


def main():
    try:
        num = input("Введите количество чисел (по умолчанию 35): ")
        num = int(num) if num else 35

        start = input("Введите начало диапазона чисел (по умолчанию 0): ")
        start = int(start) if start else 0

        end = input("Введите конец диапазона чисел (по умолчанию 100): ")
        end = int(end) if end else 100

        if start > end:
            raise ValueError("Начало диапазона не может быть больше конца диапазона.")

    except ValueError as e:
        print(f"Ошибка ввода: {e}")
        return

    result = generate_random_numbers(num, start, end)
    print("Сгенерированные числа:", result)


if __name__ == "__main__":
    main()
