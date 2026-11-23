package main

import (
	"errors"
	"fmt"
)

func calculate(a, b float64, op string) (float64, error) {
	switch op {
	case "+":
		return a + b, nil
	case "-":
		return a - b, nil
	case "*":
		return a * b, nil
	case "/":
		if b == 0 {
			return 0, errors.New("деление на ноль невозможно")
		}
		return a / b, nil
	default:
		return 0, fmt.Errorf("неизвестная операция: %s", op)
	}
}

func main() {
	var a, b float64
	var op string

	fmt.Print("Введите выражение (например, 10 + 5): ")
	if _, err := fmt.Scanln(&a, &op, &b); err != nil {
		fmt.Println("Ошибка ввода:", err)
		return
	}

	result, err := calculate(a, b, op)
	if err != nil {
		fmt.Println("Ошибка:", err)
		return
	}

	fmt.Printf("Результат: %.2f\n", result)
}
