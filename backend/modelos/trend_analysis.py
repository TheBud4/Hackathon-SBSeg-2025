from prophet import Prophet
import pandas as pd

def prepare_data(json_file):
    # Carregar os dados JSON
    data = pd.read_json(json_file)
    data['date'] = pd.to_datetime(data['date'], errors='coerce')

    # Filtrar vulnerabilidades críticas
    critical_vulns = data[data['severity'] == 'Critical']

    # Agrupar por data para contar vulnerabilidades críticas
    time_series = critical_vulns.groupby(critical_vulns['date'].dt.to_period('D')).size().reset_index(name='count')
    time_series['date'] = time_series['date'].dt.to_timestamp()
    time_series = time_series.rename(columns={'date': 'ds', 'count': 'y'})
    return time_series

def predict_trend(json_file, periods=15):
    # Preparar os dados
    time_series = prepare_data(json_file)

    # Criar e ajustar o modelo Prophet
    model = Prophet()
    model.fit(time_series)

    # Fazer previsões
    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    # Converter datas para string no formato ISO (YYYY-MM-DD)
    forecast['ds'] = forecast['ds'].dt.strftime('%Y-%m-%d')

    # Retornar previsões como lista de dicionários
    return forecast[['ds', 'yhat']].tail(periods).to_dict(orient='records') 
