import { NextApiHandler } from 'next';
import { container } from 'tsyringe';
import { cliServiceToken, CliService } from '../../services/cli';

const handler: NextApiHandler = async (req, res) => {
  const cli = container.resolve<CliService>(cliServiceToken);
  const ret = await cli.service.getAsteroidFiles();
  res.status(200).json(ret);
};

export default handler;
