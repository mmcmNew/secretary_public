// GridLayout.jsx
import React from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import GridBlock from "./GridComponents/GridBlock";


const ReactGridLayout = WidthProvider(RGL);

class GridLayout extends React.PureComponent {
  constructor(props) {
    super(props);

    // Изначальное состояние сетки (пустая сетка с 4 столбцами)
    this.state = {
      layout: [],
    };
  }

  // Метод для добавления нового блока в сетку
  addBlock = () => {
    const newBlock = {
      i: String(Date.now()), // Уникальный идентификатор блока через текущую дату и время
      x: 0, // Начальная позиция по горизонтали (столбец)
      y: 0, // Начальная позиция по вертикали (строка)
      w: 1, // Ширина блока (в столбцах)
      h: 3, // Высота блока (в строках)
    };

    this.setState((prevState) => ({
      layout: [...prevState.layout, newBlock],
    }));
  };

  render() {
    return (
      <div>
        <button onClick={this.addBlock}>Добавить блок</button>
        <ReactGridLayout
          className="layout"
          layout={this.state.layout}
          cols={4}
          rowHeight={30}
          width={1200}
        >
          {this.state.layout.map((block) => (
            <div key={block.i}>
              <GridBlock text="Hello, World!" />
            </div>
          ))}
        </ReactGridLayout>
      </div>
    );
  }
}

export default GridLayout;
